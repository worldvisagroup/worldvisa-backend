interface InvitationResult {
    invitationId: string;
    userUpdated: boolean;
}
export declare function inviteExistingUser(email: string): Promise<InvitationResult>;
export declare function createAndInviteNewUser(email: string, role: string): Promise<InvitationResult>;
export declare function inviteClientAfterSignup(clientId: string, email: string): Promise<void>;
export declare function inviteExistingClient(email: string): Promise<InvitationResult>;
export declare function revokeClerkInvitation(invitationId: string): Promise<void>;
export {};
