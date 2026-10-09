import { NextResponse } from "next/server";

export interface SpotifyNowPlayingResponse {
  isPlaying: boolean;
  track: string;
  artist: string;
  url: string;
  lastPlayedTime?: string;
  status: "playing" | "last_played" | "offline";
}

export async function GET() {
  // If user sets up Spotify API tokens (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN)
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      // 1. Get Access Token
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();

        // 2. Query Currently Playing
        const nowRes = await fetch(
          "https://api.spotify.com/v1/me/player/currently-playing",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        if (nowRes.status === 200) {
          const song = await nowRes.json();
          if (song.item) {
            const data: SpotifyNowPlayingResponse = {
              isPlaying: song.is_playing,
              track: song.item.name,
              artist: song.item.artists.map((a: { name: string }) => a.name).join(", "),
              url: song.item.external_urls?.spotify || "https://spotify.com",
              status: song.is_playing ? "playing" : "last_played",
            };
            return NextResponse.json(data, {
              headers: {
                "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
              },
            });
          }
        }

        // 3. Fallback: Query Recently Played
        const recentRes = await fetch(
          "https://api.spotify.com/v1/me/player/recently-played?limit=1",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        if (recentRes.ok) {
          const recent = await recentRes.json();
          if (recent.items?.[0]) {
            const item = recent.items[0];
            const data: SpotifyNowPlayingResponse = {
              isPlaying: false,
              track: item.track.name,
              artist: item.track.artists.map((a: { name: string }) => a.name).join(", "),
              url: item.track.external_urls?.spotify || "https://spotify.com",
              lastPlayedTime: "recently",
              status: "last_played",
            };
            return NextResponse.json(data, {
              headers: {
                "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn("Spotify API fetch failed, falling back to cached showcase track:", err);
    }
  }

  // Showcase fallback track so notch has working marquee and equalizer
  const fallbackData: SpotifyNowPlayingResponse = {
    isPlaying: true,
    track: "Midnight City",
    artist: "M83",
    url: "https://open.spotify.com/track/1eyzqe2QqGZUmfcPZtrIyt",
    status: "playing",
  };

  return NextResponse.json(fallbackData, {
    headers: {
      "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
    },
  });
}
