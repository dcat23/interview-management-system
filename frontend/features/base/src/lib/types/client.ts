/**
 * Matches ClientResponse on the backend (client/dto/ClientResponse.java).
 */
export interface Client {
  id: string;
  name: string;
  industry: string | null;
  active: boolean;
  createdAt: string;
}
