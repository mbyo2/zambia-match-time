import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldAlert, CheckCircle2, Ban, Trash2 } from 'lucide-react';

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  content_type: string;
  status: string;
  created_at: string;
}

const AdminReportsQueue: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const fetchReports = async () => {
    setLoading(true);
    let q = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter === 'pending') q = q.eq('status', 'pending');
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setReports((data as Report[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const resolve = async (id: string, status: 'resolved' | 'dismissed') => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(`Report ${status}`);
    fetchReports();
  };

  const banUser = async (userId: string) => {
    if (!confirm('Ban this user? Their profile and matches will be deactivated.')) return;
    const { error } = await (supabase as any).rpc('ban_user', { p_user_id: userId, p_reason: 'admin_report_review' });
    if (error) return toast.error(error.message);
    toast.success('User banned');
    fetchReports();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Reports Queue
        </CardTitle>
        <CardDescription>Review user reports and take action.</CardDescription>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button size="sm" variant="ghost" onClick={fetchReports} disabled={loading}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 && (
          <p className="text-sm text-muted-foreground">No reports.</p>
        )}
        {reports.map(r => (
          <div key={r.id} className="border border-border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'pending' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <span className="text-xs text-muted-foreground">{r.content_type}</span>
            </div>
            <div className="text-sm">
              <p><strong>Reason:</strong> {r.reason}</p>
              {r.description && <p className="text-muted-foreground mt-1">{r.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Reporter: <code>{r.reporter_id.slice(0, 8)}…</code> · Reported: <code>{r.reported_id.slice(0, 8)}…</code>
              </p>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => resolve(r.id, 'resolved')}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resolve(r.id, 'dismissed')}>
                  <Trash2 className="h-3 w-3 mr-1" /> Dismiss
                </Button>
                <Button size="sm" variant="destructive" onClick={() => banUser(r.reported_id)}>
                  <Ban className="h-3 w-3 mr-1" /> Ban User
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminReportsQueue;