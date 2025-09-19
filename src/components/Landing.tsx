import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck, MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Centro Universitário Univértix</h1>
                <p className="text-sm text-muted-foreground">Canal Seguro de Denúncias</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="flex items-center space-x-2 mr-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Entrar</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Painel Admin</span>
            </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Canal Seguro de Denúncias
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Um espaço seguro e confidencial para estudantes, professores e colaboradores registrarem denúncias de forma anônima ou identificada.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="border-2 hover:border-primary transition-colors cursor-pointer group" onClick={() => navigate('/anonymous-report')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Denúncia Anônima</CardTitle>
              <CardDescription className="text-base">
                Registre sua denúncia de forma completamente anônima. Você receberá um código para acompanhar o andamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Fazer Denúncia Anônima
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors cursor-pointer group" onClick={() => navigate('/auth')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Denúncia Identificada</CardTitle>
              <CardDescription className="text-base">
                Faça login com seus dados institucionais para registrar uma denúncia identificada e acompanhar suas denúncias.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full" size="lg">
                <UserCheck className="mr-2 h-5 w-5" />
                Entrar e Denunciar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Track Complaint */}
        <div className="text-center mb-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Acompanhar Denúncia</CardTitle>
              <CardDescription>
                Já fez uma denúncia? Acompanhe o status e resposta usando seu código.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={() => navigate('/track')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Acompanhar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="bg-card rounded-lg p-8 border">
          <h3 className="text-2xl font-semibold text-center mb-6">Sua Segurança é Nossa Prioridade</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Confidencialidade</h4>
              <p className="text-sm text-muted-foreground">
                Todas as denúncias são tratadas com total confidencialidade e sigilo.
              </p>
            </div>
            <div>
              <UserCheck className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Anonimato</h4>
              <p className="text-sm text-muted-foreground">
                Denúncias anônimas não revelam sua identidade em nenhum momento.
              </p>
            </div>
            <div>
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Acompanhamento</h4>
              <p className="text-sm text-muted-foreground">
                Receba atualizações sobre o andamento da sua denúncia.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;