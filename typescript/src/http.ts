export const post = (url: string, body) => fetch(url, {
  method: 'POST', body: JSON.stringify(body),
});
