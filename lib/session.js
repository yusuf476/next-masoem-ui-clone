import { cookies } from "next/headers";
import { getCartCountByUserId, getUserBySessionToken, getWishlistByUserId } from "./market.js";

export const SESSION_COOKIE = "masoem_market_session";

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const token = await getCurrentSessionToken();
  return getUserBySessionToken(token);
}

export async function getViewerContext() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      cartCount: 0,
      wishlist: [],
      notifications: [],
    };
  }

  const cartCount = await getCartCountByUserId(user.id);
  const wishlist = await getWishlistByUserId(user.id);

  return {
    user,
    cartCount,
    wishlist,
    notifications: user.notifications ?? [],
  };
}

export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
