import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Search, Clock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import bcrypt from 'bcryptjs';

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

const TrackComplaint = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [anonymousCode, setAnonymousCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Find complaint by anonymous code
      const { data: complaintData, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('anonymous_code', anonymousCode)
        .eq('is_anonymous', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Denúncia não encontrada. Verifique o código de acesso.');
        }
        throw error;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, complaintData.anonymous_password_hash);
      
      if (!isPasswordValid) {
        throw new Error('Senha incorreta. Verifique a senha informada.');
      }

      setComplaint(complaintData);
      toast({
        title: "Denúncia encontrada!",
        description: "Informações carregadas com sucesso.",
      });
    } catch (error: any) {
      console.error('Error tracking complaint:', error);
      setComplaint(null);
      toast({
        title: "Erro ao buscar denúncia",
        description: error.message || "Verifique os dados informados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Início</span>
        </Button>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-2xl space-y-6">
            {/* Search Form */}
            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Acompanhar Denúncia</CardTitle>
                <CardDescription>
                  Digite seu código de acesso e senha para verificar o status da sua denúncia anônima.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anonymousCode">Código de Acesso</Label>
                    <Input
                      id="anonymousCode"
                      type="text"
                      placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                      value={anonymousCode}
                      onChange={(e) => setAnonymousCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha definida na criação"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Buscando...' : <><Search className="mr-2 h-4 w-4" />Buscar Denúncia</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            {hasSearched && !complaint && !isLoading && (
              <Card className="border-destructive/50">
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Denúncia não encontrada</h3>
                  <p className="text-muted-foreground">
                    Verifique se o código de acesso e a senha estão corretos.
                  </p>
                </CardContent>
              </Card>
            )}

            {complaint && (
              <Card className="border-2">
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
                  
                  {complaint.admin_response ? (
                    <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-success">✅ Resposta da Administração:</h4>
                      <p className="text-sm">{complaint.admin_response}</p>
                      {complaint.responded_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Respondido em: {new Date(complaint.responded_at).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Status da Análise:</h4>
                      <p className="text-sm text-muted-foreground">
                        {complaint.status === 'pendente' && 'Sua denúncia foi recebida e está aguardando análise da administração.'}
                        {complaint.status === 'em_analise' && 'Sua denúncia está sendo analisada pela administração.'}
                        {complaint.status === 'arquivada' && 'Sua denúncia foi analisada e arquivada pela administração.'}
                      </p>
                    </div>
                  )}

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🔒 Privacidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Esta denúncia é completamente anônima. Suas informações pessoais não são armazenadas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;