// src/services/warpcastService.ts
export interface WarpcastUser {
    fid: number;
    displayName: string;
    profile: {
      
      bio: { text: string; mentions: any[] };
      channelMentions: any[];
      location: { placeId: string; description: string };
      description: string;
      earlyWalletAdopter: boolean;
      
    };
    username: string;
    followerCount: number;
    followingCount: number;
    pfp: { url: string };
    verified: boolean;
    referrerUsername: string;
    viewerContext: {
      following: boolean;
      followedBy: boolean;
      enableNotifications: boolean;
    };
  }

  export interface PrimaryAddressResult {
    fid: number;
    success: boolean;
    address?: {
      fid: number;
      protocol: string;
      address: string;
    };
  }

export interface PaginatedUsers {
    users: WarpcastUser[];
    nextCursor?: string;
}

// src/services/warpcastService.ts

export class WarpcastService {
    // Apuntamos al proxy interno de Next.js para evitar CORS
    private baseUrl = '/api/warpcast';
  
    private async fetchPage<T>(
      path: string,
      params: Record<string, string | number | undefined>,
    ): Promise<T> {
      const url = new URL(this.baseUrl + path, window.location.href);
      Object.entries(params).forEach(([k, v]) => {
        if (v != null) url.searchParams.append(k, String(v));
      });
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<T>;
    }
  
    /** Obtiene todos tus followers paginando hasta que no haya más cursor */
    async getFollowers(fid: number): Promise<WarpcastUser[]> {
      return this._collectAllPages(cursor =>
        this.fetchPage<{
          result: { users: WarpcastUser[] };
          next?: { cursor: string };
        }>('/v2/followers', { fid, cursor }).then(d => ({
          users: d.result.users,
          nextCursor: d.next?.cursor
        }))
      );
    }
  
    /** Obtiene todos a quienes sigues + leastInteracted sólo de la primera página */
    async getFollowing(fid: number): Promise<{
      users: WarpcastUser[];
      leastInteracted: { count: number; users: WarpcastUser[] };
    }> {
      let leastInteracted = { count: 0, users: [] as WarpcastUser[] };
  
      const users = await this._collectAllPages(cursor =>
        this.fetchPage<{
          result: {
            users: WarpcastUser[];
            leastInteractedWith?: { count: number; users: WarpcastUser[] };
          };
          next?: { cursor: string };
        }>('/v2/following', { fid, cursor }).then(d => {
          if (!leastInteracted.users.length && d.result.leastInteractedWith) {
            leastInteracted = d.result.leastInteractedWith;
          }
          return {
            users: d.result.users,
            nextCursor: d.next?.cursor
          };
        })
      );
  
      return { users, leastInteracted };
    }
  
    /** Obtiene las wallets primarias de un listado de FIDs */
    async getPrimaryAddresses(
      fids: number[],
      protocol: 'ethereum' | 'solana' = 'ethereum'
    ): Promise<PrimaryAddressResult[]> {

      const url = new URL(`${this.baseUrl}/fc/primary-addresses`, window.location.href);
      url.searchParams.append('fids', fids.join(','));
      url.searchParams.append('protocol', protocol);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = (await res.json()) as { result: { addresses: PrimaryAddressResult[] } };
      return json.result.addresses;
    }
  
    /** Helper: recorre todas las páginas hasta que nextCursor sea undefined */
    private async _collectAllPages(
      fetchPage: (cursor?: string) => Promise<{ users: WarpcastUser[]; nextCursor?: string }>
    ): Promise<WarpcastUser[]> {
      const all: WarpcastUser[] = [];
      let cursor: string | undefined = undefined;
      do {
        const { users, nextCursor } = await fetchPage(cursor);
        all.push(...users);
        cursor = nextCursor;
      } while (cursor);
      return all;
    }
  }