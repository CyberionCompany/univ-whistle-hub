import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, Plus, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@supabase/supabase-js";

interface Complaint {
  id: string;
  protocol_code: string;
  title: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  admin_response?: string;
  responded_at?: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and load data
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
        navigate('/admin');
        return;
      }
      
      // Load user's complaints
      await loadComplaints(session.user.id);
      setIsLoading(false);
    };

    checkAuthAndLoadData();
  }, [navigate]);

  const loadComplaints = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      console.error('Error loading complaints:', error);
      toast({
        title: "Erro ao carregar denúncias",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('complaints')
        .insert([{
          title,
          description,
          type: type as 'assedio' | 'discriminacao' | 'infraestrutura' | 'outro',
          user_id: user.id,
          is_anonymous: false,
          status: 'pendente'
        }]);

      if (error) throw error;

      toast({
        title: "Denúncia registrada com sucesso!",
        description: "Sua denúncia foi enviada e está sendo analisada.",
      });

      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setType("");
      setIsDialogOpen(false);
      
      // Reload complaints
      await loadComplaints(user.id);
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Erro ao registrar denúncia",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'em_analise':
        return <Badge variant="default"><AlertCircle className="w-3 h-3 mr-1" />Em Análise</Badge>;
      case 'respondida':
        return <Badge variant="outline" className="border-success text-success"><CheckCircle className="w-3 h-3 mr-1" />Respondida</Badge>;
      case 'arquivada':
        return <Badge variant="secondary">Arquivada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'assedio': return 'Assédio';
      case 'discriminacao': return 'Discriminação';
      case 'infraestrutura': return 'Infraestrutura';
      case 'outro': return 'Outro';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Minhas Denúncias</h1>
                <p className="text-sm text-muted-foreground">Bem-vindo, {user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Suas Denúncias</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Denúncia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Denúncia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Denúncia *</Label>
                  <Select value={type} onValueChange={setType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de denúncia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assedio">Assédio</SelectItem>
                      <SelectItem value="discriminacao">Discriminação</SelectItem>
                      <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título da Denúncia *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Resumo da sua denúncia"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Detalhada *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva detalhadamente sua denúncia..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={6}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Registrar Denúncia'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma denúncia registrada</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não registrou nenhuma denúncia. Clique no botão acima para criar sua primeira denúncia.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{complaint.title}</CardTitle>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Protocolo: <code className="bg-muted px-1 rounded">{complaint.protocol_code}</code></span>
                        <span>Tipo: {getTypeLabel(complaint.type)}</span>
                        <span>Data: {new Date(complaint.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Descrição:</h4>
                    <p className="text-muted-foreground">{complaint.description}</p>
                  </div>
                  
                  {complaint.admin_response && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-success">Resposta da Administração:</h4>
                      <p className="text-sm">{complaint.admin_response}</p>
                      {complaint.responded_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Respondido em: {new Date(complaint.responded_at).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;