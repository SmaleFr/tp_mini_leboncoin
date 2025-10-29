export const metrics = {
  http: { requestsTotal: 0 },
  images: { bytesTotal: 0 },
};

export function incRequests() {
  metrics.http.requestsTotal += 1;
}

export function addImageBytes(n) {
  const value = Number(n);
  if (Number.isFinite(value) && value > 0) {
    metrics.images.bytesTotal += value;
  }
}

