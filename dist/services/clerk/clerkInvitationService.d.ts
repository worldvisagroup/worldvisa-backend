import { StaffRole } from '../../constants/roles';
interface InvitationResult {
    invitationId: string;
    userUpdated: boolean;
}
interface BootstrapInviteInput {
    email: string;
    role: StaffRole;
    username: string;
    bootstrapToken: string | undefined;
}
export declare function inviteExistingUser(email: string): Promise<InvitationResult>;
export declare function createAndInviteNewUser(email: string, role: string, username: string): Promise<InvitationResult>;
export declare function bootstrapFirstStaffInvitation({ email, role, username, bootstrapToken, }: BootstrapInviteInput): Promise<InvitationResult>;
export declare function inviteClientAfterSignup(clientId: string, email: string): Promise<void>;
export declare function inviteExistingClient(email: string): Promise<InvitationResult>;
export declare function revokeClerkInvitation(invitationId: string): Promise<void>;
export {};
