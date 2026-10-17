import time
import requests
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import Config
from services.ssrf_guard import validate_url_safe

def classify_availability(status_code: int | None, had_redirects: bool, error: str | None) -> str:
    # If a status code was received, classify based on the HTTP status code
    if status_code is not None:
        if status_code in (401, 403):
            return "ACCESS_RESTRICTED"
        elif status_code in (404, 410):
            return "BROKEN"
        elif 400 <= status_code < 500:
            return "BROKEN"
        elif 500 <= status_code < 600:
            return "SERVER_ERROR"
        elif 200 <= status_code < 400:
            if had_redirects:
                return "REDIRECTED"
            return "WORKING"

    # Otherwise, handle network/connection/SSRF errors
    if error:
        if "SSRF" in error or "restricted" in error or "Loopback" in error or "Private IP" in error:
            return "ACCESS_RESTRICTED"
        if "DNS" in error or "resolution" in error or "Name or service not known" in error:
            return "CONNECTION_FAILED"
        if "timeout" in error.lower() or "timed out" in error.lower():
            return "CONNECTION_FAILED"
        if "ssl" in error.lower() or "certificate" in error.lower():
            return "CONNECTION_FAILED"
        return "CONNECTION_FAILED"

    return "UNKNOWN"

def check_single_url(url: str, check_headers_only: bool = False, had_explicit_scheme: bool | None = None) -> dict:
    start_time = time.perf_counter()
    url = url.strip() if isinstance(url, str) else ""
    if had_explicit_scheme is None:
        had_explicit_scheme = "://" in url
    if url and "://" not in url:
        url = "https://" + url

    result = {
        "submitted_url": url,
        "final_url": url,
        "http_status": None,
        "response_time_ms": 0,
        "redirect_chain": [],
        "availability_status": "UNKNOWN",
        "tls_valid": None,
        "content_type": None,
        "content_length": None,
        "server": None,
        "error": None,
        "timestamp": time.time(),
    }

    if not url:
        result["error"] = "Empty URL provided."
        result["availability_status"] = "BROKEN"
        return result

    # SSRF verification on initial URL
    is_safe, error_msg, _ = validate_url_safe(url)
    if not is_safe:
        result["error"] = error_msg
        result["availability_status"] = "ACCESS_RESTRICTED"
        result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)
        return result

    current_url = url
    session = requests.Session()
    # Use standard browser User-Agent and headers so legitimate websites like npmjs don't block requests as a plain bot
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    })

    redirect_chain = []
    hop_count = 0
    max_hops = Config.MAX_REDIRECTS

    try:
        while hop_count <= max_hops:
            # Re-validate every hop against SSRF before making the request
            hop_safe, hop_err, _ = validate_url_safe(current_url)
            if not hop_safe:
                result["error"] = f"Redirect target rejected by SSRF guard: {hop_err}"
                result["availability_status"] = "ACCESS_RESTRICTED"
                result["final_url"] = current_url
                result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)
                result["redirect_chain"] = redirect_chain
                return result

            # Perform request with strict timeout and TLS verification
            req_start = time.perf_counter()
            response = session.get(
                current_url,
                allow_redirects=False,
                timeout=Config.URL_REQUEST_TIMEOUT,
                verify=True,
                stream=True
            )
            # Read first chunk to inspect response & ensure connection succeeded, then close
            chunk = next(response.iter_content(chunk_size=1024), b'')
            response.close()

            status_code = response.status_code
            result["http_status"] = status_code
            result["tls_valid"] = True
            result["content_type"] = response.headers.get("Content-Type")
            result["server"] = response.headers.get("Server")
            cl = response.headers.get("Content-Length")
            if cl and cl.isdigit():
                result["content_length"] = int(cl)

            # Check for Cloudflare / Anti-bot protection when 403 occurs
            if status_code == 403:
                server_hdr = str(response.headers.get("Server", "")).lower()
                cf_mitigated = response.headers.get("cf-mitigated")
                chunk_str = chunk.decode("utf-8", errors="ignore")
                if "cloudflare" in server_hdr or cf_mitigated or "just a moment" in chunk_str.lower() or "turnstile" in chunk_str.lower():
                    result["error"] = "HTTP 403 Forbidden (Cloudflare Bot Protection / Challenge)"
                else:
                    result["error"] = "HTTP 403 Forbidden (Access Restricted)"
            elif status_code == 401:
                result["error"] = "HTTP 401 Unauthorized"

            # Check if this response is a redirect
            if response.is_redirect or response.is_permanent_redirect or status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("Location")
                if not location:
                    break
                next_url = urljoin(current_url, location)
                redirect_chain.append({
                    "hop": hop_count + 1,
                    "from_url": current_url,
                    "to_url": next_url,
                    "status_code": status_code
                })
                current_url = next_url
                hop_count += 1
                if hop_count > max_hops:
                    result["error"] = f"Exceeded maximum redirection limit of {max_hops} hops."
                    break
            else:
                # Terminal response reached
                break

        result["final_url"] = current_url
        result["redirect_chain"] = redirect_chain
        result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)
        had_redirects = len(redirect_chain) > 0
        result["availability_status"] = classify_availability(result["http_status"], had_redirects, result["error"])

    except (requests.exceptions.SSLError, requests.exceptions.ConnectionError) as e:
        # If user typed domain without scheme and HTTPS was rejected/unsupported, fallback to HTTP
        if not had_explicit_scheme and url.startswith("https://"):
            http_fallback_url = "http://" + url[8:]
            try:
                fallback_res = check_single_url(http_fallback_url, check_headers_only=check_headers_only, had_explicit_scheme=True)
                if fallback_res.get("availability_status") in ("WORKING", "REDIRECTED", "ACCESS_RESTRICTED", "BROKEN"):
                    fallback_res["submitted_url"] = url
                    return fallback_res
            except Exception:
                pass

        if isinstance(e, requests.exceptions.SSLError):
            result["tls_valid"] = False
            result["error"] = f"TLS/SSL Certificate Verification Failed: {str(e)}"
        else:
            result["error"] = f"Connection failed: {str(e)}"
        result["availability_status"] = "CONNECTION_FAILED"
        result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)

    except requests.exceptions.ConnectTimeout:
        result["error"] = f"Connection timed out after {Config.URL_REQUEST_TIMEOUT}s."
        result["availability_status"] = "CONNECTION_FAILED"
        result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)
    except requests.exceptions.ReadTimeout:
        result["error"] = f"Server read timed out after {Config.URL_REQUEST_TIMEOUT}s."
        result["availability_status"] = "CONNECTION_FAILED"
        result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)
    except Exception as e:
        result["error"] = f"Scan error: {str(e)}"
        result["availability_status"] = "UNKNOWN"
        result["response_time_ms"] = int((time.perf_counter() - start_time) * 1000)

    return result

def check_multiple_urls(urls: list[str], max_workers: int = 5) -> list[dict]:
    results = []
    # Deduplicate while preserving order
    clean_urls = []
    for u in urls:
        u_str = u.strip() if isinstance(u, str) else ""
        if u_str and u_str not in clean_urls:
            clean_urls.append(u_str)

    with ThreadPoolExecutor(max_workers=min(max_workers, Config.MAX_CONCURRENT_CHECKS)) as executor:
        future_map = {executor.submit(check_single_url, u): u for u in clean_urls}
        for future in as_completed(future_map):
            try:
                res = future.result()
                results.append(res)
            except Exception as e:
                orig_url = future_map[future]
                results.append({
                    "submitted_url": orig_url,
                    "final_url": orig_url,
                    "http_status": None,
                    "response_time_ms": 0,
                    "redirect_chain": [],
                    "availability_status": "UNKNOWN",
                    "error": str(e),
                    "timestamp": time.time()
                })
    return results
