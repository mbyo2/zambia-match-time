import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ErrorLog {
  id: string;
  user_id: string | null;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

const AdminErrorLogs: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs((data ?? []) as ErrorLog[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Client Error Logs
          </CardTitle>
          <CardDescription>Last 50 frontend errors captured by the ErrorBoundary.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No errors logged. 🎉</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isOpen = expanded === log.id;
              return (
                <div
                  key={log.id}
                  className="border border-border rounded-lg p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {log.url ?? 'no url'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </Badge>
                      {log.user_id && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {log.user_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {log.stack && (
                        <pre className="text-[11px] bg-muted/60 p-2 rounded overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
                          {log.stack}
                        </pre>
                      )}
                      {log.user_agent && (
                        <p className="text-[11px] text-muted-foreground break-all">
                          <span className="font-semibold">UA:</span> {log.user_agent}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminErrorLogs;