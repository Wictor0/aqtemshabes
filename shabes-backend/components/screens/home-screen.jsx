
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Calendar, 
  Users, 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  Star,
  Clock,
  MapPin,
  LogOut
} from 'lucide-react';
import { mockEvents, mockEventMatches, getMatchesByGuestId, getRecommendedEvents } from '@/lib/mock-data';
import { formatShabbatDate, getNextShabbat } from '@/lib/utils';
import EventCard from '@/components/cards/event-card';
import MatchCard from '@/components/cards/match-card';
import { useRouter } from 'next/navigation';

export default function HomeScreen() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [userMatches, setUserMatches] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);

  useEffect(() => {
    if (session?.user?.id) {
      const matches = getMatchesByGuestId(session.user.id);
      setUserMatches(matches);
      
      const recommended = getRecommendedEvents(session.user.id);
      setRecommendedEvents(recommended);
    }
  }, [session]);

  const handleSignOut = () => {
    signOut();
  };

  const nextShabbat = getNextShabbat();
  const pendingMatches = userMatches.filter(match => match.status === 'PENDING');
  const upcomingEvents = mockEvents.filter(event => new Date(event.date) >= new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b z-50 safe-area-top">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Aquitemshabes</h1>
                <p className="text-xs text-muted-foreground">
                  Shalom, {session?.user?.name?.split(' ')[0]}! 👋
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {pendingMatches.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs p-0 flex items-center justify-center">
                    {pendingMatches.length}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-md px-4 py-6 space-y-6">
        {/* Next Shabbat Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-fade-in-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Agenda de Shabat</h2>
                <p className="text-blue-100">{formatShabbatDate(nextShabbat)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 animate-slide-in-left">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                  <p className="text-sm text-muted-foreground">Eventos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{userMatches.length}</p>
                  <p className="text-sm text-muted-foreground">Seus Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">O que você gostaria de fazer?</h2>
          <div className="grid gap-4">
            <Button
              onClick={() => router.push('/events/discover')}
              variant="default"
              size="xl"
              className="w-full justify-start space-x-4 h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Search className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Encontrar Shabat</p>
                <p className="text-sm opacity-90">Descubra eventos próximos a você</p>
              </div>
            </Button>
            
            <Button
              onClick={() => router.push('/events/create')}
              variant="outline"
              size="xl"
              className="w-full justify-start space-x-4 h-16 border-purple-200 hover:bg-purple-50"
            >
              <Plus className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Oferecer Evento</p>
                <p className="text-sm opacity-90">Abra sua casa para a comunidade</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Pending Matches */}
        {pendingMatches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Aguardando Resposta</h2>
              <Badge variant="destructive">{pendingMatches.length}</Badge>
            </div>
            <div className="space-y-3">
              {pendingMatches.slice(0, 2).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isHost={false}
                  onAccept={() => router.push(`/matches/${match.id}`)}
                  onDecline={() => router.push(`/matches/${match.id}`)}
                  onRequestChat={() => router.push(`/matches/${match.id}`)}
                />
              ))}
              {pendingMatches.length > 2 && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/matches')}
                  className="w-full"
                >
                  Ver Todos os Matches ({pendingMatches.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recommended Events */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recomendados para Você</h2>
          <div className="space-y-3">
            {recommendedEvents.slice(0, 3).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onInterest={() => router.push(`/events/${event.id}`)}
                showDistance={true}
                distance={event.distance}
                matchScore={event.matchScore}
              />
            ))}
          </div>
          {recommendedEvents.length > 3 && (
            <Button
              variant="outline"
              onClick={() => router.push('/events/discover')}
              className="w-full"
            >
              Ver Todos os Eventos
            </Button>
          )}
        </div>

        {/* Navigation Spacer */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t safe-area-bottom z-50">
        <div className="container mx-auto max-w-md px-4">
          <div className="flex items-center justify-around py-2">
            <Button
              variant={activeTab === 'home' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('home')}
              className="flex-col h-auto py-2 px-3"
            >
              <Home className="h-4 w-4" />
              <span className="text-xs mt-1">Início</span>
            </Button>
            <Button
              variant={activeTab === 'discover' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('discover');
                router.push('/events/discover');
              }}
              className="flex-col h-auto py-2 px-3"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs mt-1">Descobrir</span>
            </Button>
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('create');
                router.push('/events/create');
              }}
              className="flex-col h-auto py-2 px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs mt-1">Criar</span>
            </Button>
            <Button
              variant={activeTab === 'matches' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('matches');
                router.push('/matches');
              }}
              className="flex-col h-auto py-2 px-3 relative"
            >
              <Users className="h-4 w-4" />
              <span className="text-xs mt-1">Matches</span>
              {pendingMatches.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-xs p-0 flex items-center justify-center">
                  {pendingMatches.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('profile');
                router.push('/profile');
              }}
              className="flex-col h-auto py-2 px-3"
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs mt-1">Perfil</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
