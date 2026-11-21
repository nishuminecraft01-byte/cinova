export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.hostname = 'cinova.nishuminecraft01.workers.dev';
    url.protocol = 'https:';
    url.port = '';

    const reqInit = {
      method: request.method,
      headers: new Headers(request.headers),
      redirect: 'manual',
    };
    reqInit.headers.set('Host', 'cinova.nishuminecraft01.workers.dev');
    reqInit.headers.set('X-Forwarded-Host', url.hostname);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      reqInit.body = request.body;
      reqInit.duplex = 'half';
    }

    try {
      const response = await fetch(url.toString(), reqInit);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (err) {
      return new Response('Gateway error: ' + err.message, { status: 502 });
    }
  }
};
