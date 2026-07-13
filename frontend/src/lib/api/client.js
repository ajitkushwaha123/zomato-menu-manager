import axios from "axios";

const client = axios.create({
  timeout: 30000,
});

export async function apiClient({
  req,
  baseURL = process.env.ZOMATO_API_BASE_URL,
  endpoint,
  method = "GET",
  data,
  params,
  headers = {},
  contentType,
}) {
  const cookie = req?.headers?.get("x-zomato-cookie") ?? "";

  const finalHeaders = {
    Accept: "application/json, text/plain, */*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
    "x-zomato-app-version": "2",
    "x-client-id": "zomato_web_merchant",
    ...(cookie && { Cookie: cookie }),
    ...headers,
  };

  if (!(data instanceof FormData) && !headers["content-type"] && !headers["Content-Type"]) {
    finalHeaders["Content-Type"] =
      contentType === "form"
        ? "application/x-www-form-urlencoded"
        : "application/json";
  }

  try {
    const { data: response } = await client.request({
      baseURL,
      url: endpoint,
      method,
      data,
      params,
      headers: finalHeaders,
    });

    return response;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message
      );
    }

    throw err;
  }
}