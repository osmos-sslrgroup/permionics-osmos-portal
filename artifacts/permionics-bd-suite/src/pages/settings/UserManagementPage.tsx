import { useState, useEffect } from "react";
import { customFetch, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "user";
  created_at: string;
  is_blocked?: boolean;
}

export function UserManagementPage() {
  const { toast } = useToast();
  const { data: meData } = useGetMe();
  const isAdmin = (meData as any)?.user?.role === "admin";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form for creating Operator
  const [opName, setOpName] = useState("");
  const [opEmail, setOpEmail] = useState("");
  const [opPassword, setOpPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await customFetch("/api/auth/users");
      setUsers((res as UserItem[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h3 className="text-sm font-bold text-foreground mb-1">Administrator Access Required</h3>
        <p className="text-xs text-muted-foreground">
          User and Operator account management is restricted strictly to Portal Administrators.
        </p>
      </div>
    );
  }

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opEmail || !opPassword) return;
    setIsCreating(true);

    try {
      await customFetch("/api/auth/operator", {
        method: "POST",
        body: JSON.stringify({ name: opName || "Operator", email: opEmail, password: opPassword }),
      });

      toast({
        title: "Operator Account Created",
        description: `Created operator account for ${opEmail}. They can now log in and create content.`,
      });

      setOpName("");
      setOpEmail("");
      setOpPassword("");
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Failed to Create Operator",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleBlock = async (id: string, email: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} user account ${email}?`)) return;

    try {
      await customFetch(`/api/auth/users/${id}/block`, {
        method: "POST",
        body: JSON.stringify({ blocked: !currentlyBlocked }),
      });
      toast({ title: "Success", description: `Account ${email} has been ${action}ed.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user account ${email}?`)) return;

    try {
      await customFetch(`/api/auth/users/${id}`, { method: "DELETE" });
      toast({ title: "User Account Deleted", description: `Account ${email} has been removed.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Operator Form */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-1">Create Operator Account (Admin Only)</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Operators can log in, reset passwords, create case studies, and generate questionnaires.
        </p>

        <form onSubmit={handleCreateOperator} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Operator Name</label>
            <Input
              placeholder="e.g. John Doe"
              value={opName}
              onChange={(e) => setOpName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="operator@permionics.com"
              value={opEmail}
              onChange={(e) => setOpEmail(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Temporary Password</label>
            <Input
              type="password"
              placeholder="Set temp password"
              value={opPassword}
              onChange={(e) => setOpPassword(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>
          <Button type="submit" size="sm" className="h-9 font-bold text-xs" disabled={isCreating}>
            {isCreating ? "Creating..." : "+ Add Operator Account"}
          </Button>
        </form>
      </div>

      {/* Accounts List Table */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Registered User & Operator Accounts</h3>
        {loading ? (
          <div className="text-xs text-muted-foreground py-4">Loading accounts...</div>
        ) : users.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4">No custom user/operator accounts created yet. Admin logs in with default password.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2 px-3">Name / Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Created Date</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/40 ${u.is_blocked ? "opacity-60" : ""}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">
                        {u.name || "User"} {u.is_blocked && <span className="text-red-500 text-[10px] uppercase font-bold ml-1">(Blocked)</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            : u.role === "operator"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {u.role !== "admin" && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleToggleBlock(u.id, u.email, !!u.is_blocked)}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-800 dark:text-amber-400"
                          >
                            {u.is_blocked ? "Unblock" : "Block"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
