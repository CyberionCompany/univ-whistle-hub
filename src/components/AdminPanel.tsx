import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, Clock, CheckCircle, AlertCircle, MessageSquare, Filter, Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { User } from "@supabase/supabase-js";
import Papa from 'papaparse';
import jsPDF from 'jspdf';

interface Complaint {
  id: string;
  protocol_code: string;
  title: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  is_anonymous: boolean;
  admin_response?: string;
  responded_at?: string;
  user_id?: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null | any;
}

const AdminPanel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, [navigate]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter, typeFilter]);

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

    if (!profile?.is_admin) {
      navigate('/dashboard');
      return;
    }
    
    await loadComplaints();
    setIsLoading(false);
  };

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
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

  const filterComplaints = () => {
    let filtered = complaints;

    if (statusFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.type === typeFilter);
    }

    setFilteredComplaints(filtered);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleUpdateComplaint = async (complaintId: string, newStatus: string, response?: string) => {
    setIsSubmitting(true);

    try {
      const updateData: any = {
        status: newStatus,
        admin_user_id: user?.id,
      };

      if (response) {
        updateData.admin_response = response;
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);

      if (error) throw error;

      toast({
        title: "Denúncia atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      await loadComplaints();
      setSelectedComplaint(null);
      setAdminResponse("");
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      toast({
        title: "Erro ao atualizar denúncia",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const csvData = filteredComplaints.map(complaint => ({
      'Protocolo': complaint.protocol_code,
      'Título': complaint.title,
      'Tipo': getTypeLabel(complaint.type),
      'Status': complaint.status,
      'Data': new Date(complaint.created_at).toLocaleDateString('pt-BR'),
      'Anônima': complaint.is_anonymous ? 'Sim' : 'Não',
      'Denunciante': complaint.is_anonymous ? 'Anônimo' : complaint.profiles?.full_name || 'N/A',
      'Descrição': complaint.description,
      'Resposta Admin': complaint.admin_response || 'Sem resposta'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `denuncias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório CSV exportado!",
      description: "O arquivo foi baixado com sucesso.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text('Relatório de Denúncias - Univértix', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    doc.text(`Total de denúncias: ${filteredComplaints.length}`, 20, 40);
    
    let yPosition = 60;
    
    filteredComplaints.forEach((complaint, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${index + 1}. Protocolo: ${complaint.protocol_code}`, 20, yPosition);
      yPosition += 7;
      
      doc.text(`Título: ${complaint.title}`, 20, yPosition);
      yPosition += 7;
      
      doc.text(`Tipo: ${getTypeLabel(complaint.type)} | Status: ${complaint.status}`, 20, yPosition);
      yPosition += 7;
      
      doc.text(`Data: ${new Date(complaint.created_at).toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 7;
      
      if (!complaint.is_anonymous && complaint.profiles?.full_name) {
        doc.text(`Denunciante: ${complaint.profiles.full_name}`, 20, yPosition);
        yPosition += 7;
      }
      
      if (complaint.admin_response) {
        doc.text(`Resposta: ${complaint.admin_response.substring(0, 80)}...`, 20, yPosition);
        yPosition += 7;
      }
      
      yPosition += 10;
    });
    
    doc.save(`denuncias_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Relatório PDF exportado!",
      description: "O arquivo foi baixado com sucesso.",
    });
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
                <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Gestão de Denúncias - {user?.email}</p>
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
        {/* Filters and Export */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label>Filtros:</Label>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="respondida">Respondida</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="assedio">Assédio</SelectItem>
                <SelectItem value="discriminacao">Discriminação</SelectItem>
                <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{complaints.length}</div>
              <div className="text-sm text-muted-foreground">Total de Denúncias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">
                {complaints.filter(c => c.status === 'pendente').length}
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">
                {complaints.filter(c => c.status === 'em_analise').length}
              </div>
              <div className="text-sm text-muted-foreground">Em Análise</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">
                {complaints.filter(c => c.status === 'respondida').length}
              </div>
              <div className="text-sm text-muted-foreground">Respondidas</div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints List */}
        <div className="grid gap-6">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="border-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      {getStatusBadge(complaint.status)}
                      {complaint.is_anonymous && (
                        <Badge variant="outline">Anônima</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Protocolo: <code className="bg-muted px-1 rounded">{complaint.protocol_code}</code></span>
                      <span>Tipo: {getTypeLabel(complaint.type)}</span>
                      <span>Data: {new Date(complaint.created_at).toLocaleDateString('pt-BR')}</span>
                      {!complaint.is_anonymous && complaint.profiles && (
                        <span>Por: {complaint.profiles.full_name}</span>
                      )}
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setAdminResponse(complaint.admin_response || "");
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Gerenciar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Gerenciar Denúncia - {complaint.protocol_code}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="font-semibold">Título:</Label>
                          <p className="text-sm mt-1">{complaint.title}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Descrição:</Label>
                          <p className="text-sm mt-1 bg-muted p-3 rounded">{complaint.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold">Tipo:</Label>
                            <p className="text-sm mt-1">{getTypeLabel(complaint.type)}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Status Atual:</Label>
                            <div className="mt-1">{getStatusBadge(complaint.status)}</div>
                          </div>
                        </div>

                        {!complaint.is_anonymous && complaint.profiles && (
                          <div>
                            <Label className="font-semibold">Denunciante:</Label>
                            <p className="text-sm mt-1">{complaint.profiles.full_name} ({complaint.profiles.email})</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="response">Resposta da Administração:</Label>
                          <Textarea
                            id="response"
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Digite sua resposta para o denunciante..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Alterar Status:</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateComplaint(complaint.id, 'em_analise')}
                              disabled={isSubmitting || complaint.status === 'em_analise'}
                            >
                              Marcar em Análise
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateComplaint(complaint.id, 'respondida', adminResponse)}
                              disabled={isSubmitting || !adminResponse.trim()}
                            >
                              {isSubmitting ? 'Salvando...' : 'Responder e Finalizar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUpdateComplaint(complaint.id, 'arquivada', adminResponse)}
                              disabled={isSubmitting}
                            >
                              Arquivar
                            </Button>
                          </div>
                        </div>

                        {complaint.admin_response && (
                          <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
                            <Label className="font-semibold text-success">Resposta Atual:</Label>
                            <p className="text-sm mt-1">{complaint.admin_response}</p>
                            {complaint.responded_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Respondido em: {new Date(complaint.responded_at).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">{complaint.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredComplaints.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma denúncia encontrada</h3>
              <p className="text-muted-foreground">
                Não há denúncias que correspondam aos filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;