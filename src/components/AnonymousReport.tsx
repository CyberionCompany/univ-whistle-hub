import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, FileText, Eye, EyeOff } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const AnonymousReport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [protocolCode, setProtocolCode] = useState("");
  const [anonymousCode, setAnonymousCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Senha necessária",
        description: "Por favor, defina uma senha para acessar sua denúncia posteriormente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique anonymous code
      const generatedCode = uuidv4();
      
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert complaint
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          title,
          description,
          type: type as 'assedio' | 'discriminacao' | 'infraestrutura' | 'outro',
          is_anonymous: true,
          anonymous_code: generatedCode,
          anonymous_password_hash: passwordHash,
          status: 'pendente'
        }])
        .select('protocol_code')
        .single();

      if (error) {
        throw error;
      }

      setProtocolCode(data.protocol_code);
      setAnonymousCode(generatedCode);
      setIsSuccess(true);

      toast({
        title: "Denúncia registrada com sucesso!",
        description: "Guarde seu código e senha para acompanhamento.",
      });
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Erro ao registrar denúncia",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-2xl text-success">Denúncia Registrada com Sucesso!</CardTitle>
                <CardDescription>
                  Sua denúncia foi registrada. Guarde as informações abaixo para acompanhar o andamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Protocolo de Acompanhamento</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-lg font-mono bg-background px-3 py-2 rounded border flex-1">
                        {protocolCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(protocolCode)}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Código de Acesso</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-lg font-mono bg-background px-3 py-2 rounded border flex-1">
                        {anonymousCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(anonymousCode)}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Sua Senha</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-lg font-mono bg-background px-3 py-2 rounded border flex-1">
                        {password}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(password)}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-warning-foreground mb-2">⚠️ Importante</h4>
                  <ul className="text-sm text-warning-foreground space-y-1">
                    <li>• Guarde essas informações em local seguro</li>
                    <li>• Você precisará do <strong>código de acesso</strong> e <strong>senha</strong> para acompanhar sua denúncia</li>
                    <li>• Não compartilhe essas informações com terceiros</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => navigate('/track')} 
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Acompanhar Denúncia
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Voltar ao Início
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Denúncia Anônima</CardTitle>
              <CardDescription>
                Sua identidade será mantida em sigilo. Você receberá um código para acompanhar o andamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="password">Senha para Acompanhamento *</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Defina uma senha segura"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={4}
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSecurePassword}
                    >
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você precisará desta senha junto com o código de acesso para acompanhar sua denúncia.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🔒 Garantia de Anonimato</h4>
                  <p className="text-sm text-muted-foreground">
                    Esta denúncia será completamente anônima. Não coletamos dados pessoais que possam identificá-lo.
                    O código gerado e sua senha são as únicas formas de acessar esta denúncia.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrando...' : 'Registrar Denúncia'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnonymousReport;