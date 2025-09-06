
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MapPin, Clock, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { isValidEmail } from '@/lib/utils';

export default function SignUpForm({ inviteCode, onBack }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    maxDistance: '15',
    address: '',
    preferredStartTime: '19:00',
    preferredEndTime: '22:00',
<<<<<<< HEAD
=======
    dietary: 'kosher',
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
    notes: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    if (!isValidEmail(formData.email)) {
      toast.error('Email inválido');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem');
      return;
    }
    
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Mock API call - in real app would call signup endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          inviteCode
        }),
      });
      
      if (response.ok) {
        toast.success('Conta criada com sucesso!');
        // In real app, would redirect to login or auto-login
        onBack();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erro no servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={step === 1 ? onBack : () => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-lg">
                  {step === 1 ? 'Criar Conta' : 'Preferências'}
                </CardTitle>
                <CardDescription>
                  {step === 1 ? 'Preencha seus dados pessoais' : 'Configure suas preferências'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Continuar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="address" className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Endereço (Bairro, Cidade)</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Vila Madalena, São Paulo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxDistance">Distância Máxima (km)</Label>
                  <Select 
                    value={formData.maxDistance} 
                    onValueChange={(value) => handleInputChange('maxDistance', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="15">15 km</SelectItem>
                      <SelectItem value="20">20 km</SelectItem>
                      <SelectItem value="30">30 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Início Preferido</span>
                    </Label>
                    <Select 
                      value={formData.preferredStartTime} 
                      onValueChange={(value) => handleInputChange('preferredStartTime', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18:00">18:00</SelectItem>
                        <SelectItem value="18:30">18:30</SelectItem>
                        <SelectItem value="19:00">19:00</SelectItem>
                        <SelectItem value="19:30">19:30</SelectItem>
                        <SelectItem value="20:00">20:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="endTime">Fim Preferido</Label>
                    <Select 
                      value={formData.preferredEndTime} 
                      onValueChange={(value) => handleInputChange('preferredEndTime', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="21:00">21:00</SelectItem>
                        <SelectItem value="21:30">21:30</SelectItem>
                        <SelectItem value="22:00">22:00</SelectItem>
                        <SelectItem value="22:30">22:30</SelectItem>
                        <SelectItem value="23:00">23:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
<<<<<<< HEAD
=======
                  <Label htmlFor="dietary" className="flex items-center space-x-2">
                    <Utensils className="h-4 w-4" />
                    <span>Preferência Alimentar</span>
                  </Label>
                  <Select 
                    value={formData.dietary} 
                    onValueChange={(value) => handleInputChange('dietary', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kosher">Kosher</SelectItem>
                      <SelectItem value="traditional">Tradicional</SelectItem>
                      <SelectItem value="vegetarian">Vegetariano</SelectItem>
                      <SelectItem value="any">Qualquer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
                  <Label htmlFor="notes">Observações (Opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Conte um pouco sobre você e suas expectativas..."
                    rows={3}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
