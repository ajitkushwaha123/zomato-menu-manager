import axios from "axios";

export async function AuthClient({
  endpoint,
  method = "GET",
  data = null,
  params = null,
  headers = {},
  contentType,
}) {
  try {
    const isFormData =
      typeof FormData !== "undefined" && data instanceof FormData;

    const baseURL = process.env.NEXT_PUBLIC_ZOMATO_ACCOUNTS_API;
    console.log(`${baseURL}${endpoint}`);

    let finalHeaders = {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
      //   Cookie: process.env.ZOMATO_COOKIES,
      ...headers,
    };

    if (!isFormData) {
      finalHeaders["Content-Type"] =
        contentType === "form"
          ? "application/x-www-form-urlencoded"
          : "application/json";
    }

    const response = await axios({
      url: `${baseURL}${endpoint}`,
      method,
      data,
      params,
      headers: finalHeaders,
    });

    const respData = response?.data;
    console.log("respData", response);

    if (!respData || respData?.success === false) {
      return {
        success: false,
        message: respData?.message || "Request failed",
        status: response.status,
      };
    }

    return {
      success: true,
      data: respData,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
      status: error?.response?.status || 500,
    };
  }
}
