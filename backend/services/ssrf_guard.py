import socket
import ipaddress
from urllib.parse import urlparse

# Restricted hostnames
BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    "instance-data",
}

NAT64_PREFIX = ipaddress.IPv6Network("64:ff9b::/96")
NAT64_LOCAL_PREFIX = ipaddress.IPv6Network("64:ff9b:1::/48")

def is_ip_private_or_restricted(ip_str: str) -> tuple[bool, str]:
    try:
        ip = ipaddress.ip_address(ip_str)

        # Handle NAT64 / DNS64 IPv4-embedded IPv6 addresses (RFC 6052 & RFC 8215)
        # Windows and cellular/broadband ISPs synthesize these for IPv4 destinations
        if isinstance(ip, ipaddress.IPv6Address) and (ip in NAT64_PREFIX or ip in NAT64_LOCAL_PREFIX):
            embedded_ipv4 = ipaddress.IPv4Address(ip.packed[-4:])
            return is_ip_private_or_restricted(str(embedded_ipv4))

        if ip.is_loopback:
            return True, f"Loopback address ({ip}) is not permitted."
        if ip.is_private:
            return True, f"Private IP address ({ip}) is not permitted."
        if ip.is_link_local:
            return True, f"Link-local IP address ({ip}) is not permitted."
        if ip.is_multicast:
            return True, f"Multicast IP address ({ip}) is not permitted."
        if ip.is_reserved:
            return True, f"Reserved IP address ({ip}) is not permitted."
        if ip.is_unspecified:
            return True, f"Unspecified IP address ({ip}) is not permitted."
        # AWS / GCP metadata
        if str(ip) in ("169.254.169.254", "100.100.100.200"):
            return True, "Cloud metadata endpoint is not permitted."
        return False, ""
    except ValueError:
        return True, f"Invalid IP address format: {ip_str}"

def validate_url_safe(url: str) -> tuple[bool, str, dict]:
    """
    Validates that a URL uses http/https, resolves DNS,
    and ensures it does not resolve to any internal, private, loopback, or cloud-metadata IP.
    Returns (is_safe, error_message, details_dict)
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string.", {"error_type": "EMPTY_URL"}

    url = url.strip()
    if "://" not in url:
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Malformed URL syntax: {str(e)}", {"error_type": "MALFORMED_URL"}

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.", {"error_type": "UNSUPPORTED_SCHEME"}

    hostname = parsed.hostname
    if not hostname:
        return False, "URL is missing a valid hostname.", {"error_type": "MISSING_HOSTNAME"}

    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES or hostname_lower.endswith(".local") or hostname_lower.endswith(".internal"):
        return False, f"Access to internal hostname '{hostname}' is blocked.", {"error_type": "SSRF_BLOCKED", "hostname": hostname}

    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)

    # DNS Resolution
    resolved_ips = []
    try:
        addr_infos = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
        for ai in addr_infos:
            ip_str = ai[4][0]
            if ip_str not in resolved_ips:
                resolved_ips.append(ip_str)
    except socket.gaierror as e:
        return False, f"DNS resolution failed for '{hostname}': {str(e)}", {"resolved_ips": [], "error_type": "DNS_ERROR", "hostname": hostname}
    except Exception as e:
        return False, f"Network resolution error for '{hostname}': {str(e)}", {"resolved_ips": [], "error_type": "NETWORK_ERROR", "hostname": hostname}

    if not resolved_ips:
        return False, f"Could not resolve any IP addresses for host '{hostname}'.", {"resolved_ips": [], "error_type": "DNS_ERROR", "hostname": hostname}

    # Verify every resolved IP
    for ip_str in resolved_ips:
        is_restricted, reason = is_ip_private_or_restricted(ip_str)
        if is_restricted:
            return False, f"Security Block (SSRF): Host '{hostname}' resolves to restricted destination: {reason}", {"resolved_ips": resolved_ips, "error_type": "SSRF_BLOCKED", "hostname": hostname}

    return True, "", {
        "hostname": hostname,
        "port": port,
        "scheme": parsed.scheme.lower(),
        "resolved_ips": resolved_ips,
        "error_type": None
    }

