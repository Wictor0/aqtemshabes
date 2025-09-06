
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Check, 
  X,
  Heart,
  User,
  Star
} from 'lucide-react';
import { MatchStatus } from '@/lib/types';
import { formatTime } from '@/lib/utils';

export default function MatchCard({ 
  match, 
  isHost = false,
  onAccept,
  onDecline,
  onRequestChat,
  showActions = true 
}) {
  if (!match) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case MatchStatus.PENDING:
        return <Badge variant="secondary">Aguardando</Badge>;
      case MatchStatus.ACCEPTED:
        return <Badge className="bg-green-100 text-green-800">Aceito</Badge>;
      case MatchStatus.DECLINED:
        return <Badge variant="destructive">Recusado</Badge>;
      case MatchStatus.CHAT_REQUESTED:
        return <Badge className="bg-blue-100 text-blue-800">Chat Solicitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case MatchStatus.ACCEPTED:
        return 'border-l-green-500';
      case MatchStatus.DECLINED:
        return 'border-l-red-500';
      case MatchStatus.CHAT_REQUESTED:
        return 'border-l-blue-500';
      default:
        return 'border-l-yellow-500';
    }
  };

  const event = match.event;
  const guest = match.guest;
  const isPending = match.status === MatchStatus.PENDING;

  return (
    <Card className={`shadow-md hover:shadow-lg transition-all duration-200 border-l-4 ${getStatusColor(match.status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-1">
              {isHost ? guest?.name : event?.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {isHost ? 'Interessado em seu evento' : `Evento de ${event?.host?.name}`}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {getStatusBadge(match.status)}
            {match.matchScore && (
              <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                <Star className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {Math.round(match.matchScore * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Event Details */}
        {event && (
          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900">
              {isHost ? 'Seu Evento:' : 'Evento:'} {event.title}
            </h4>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{event.date?.toLocaleDateString?.('pt-BR') || 'Data não disponível'}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.approximateAddress}</span>
            </div>
          </div>
        )}

        {/* Guest Info (for hosts) */}
        {isHost && guest && (
          <div className="space-y-2 text-sm bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{guest.name}</span>
            </div>
            {guest.preferences?.notes && (
              <p className="text-xs text-muted-foreground">
                "{guest.preferences.notes}"
              </p>
            )}
          </div>
        )}

        {/* Personal Message */}
        {match.personalMessage && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">
              {isHost ? 'Mensagem do interessado:' : 'Sua mensagem:'}
            </h4>
            <p className="text-sm text-muted-foreground italic">
              "{match.personalMessage}"
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Criado: {match.createdAt?.toLocaleString?.('pt-BR') || 'Data não disponível'}</p>
          {match.respondedAt && (
            <p>Respondido: {match.respondedAt.toLocaleString('pt-BR')}</p>
          )}
        </div>

        {/* Actions for Hosts */}
        {showActions && isHost && isPending && (
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={() => onAccept?.(match.id)}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Aceitar
            </Button>
            
            <Button
              onClick={() => onRequestChat?.(match.id)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
            
            <Button
              onClick={() => onDecline?.(match.id)}
              size="sm"
              variant="destructive"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>
          </div>
        )}

        {/* Info for non-pending matches */}
        {!isPending && (
          <div className="flex items-center justify-center py-2">
            {match.status === MatchStatus.ACCEPTED && (
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isHost ? 'Você aceitou este match' : 'Seu interesse foi aceito!'}
                </span>
              </div>
            )}
            
            {match.status === MatchStatus.DECLINED && (
              <div className="flex items-center space-x-2 text-red-600">
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isHost ? 'Você recusou este match' : 'Seu interesse foi recusado'}
                </span>
              </div>
            )}
            
            {match.status === MatchStatus.CHAT_REQUESTED && (
              <div className="flex items-center space-x-2 text-blue-600">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isHost ? 'Você solicitou um chat' : 'O anfitrião quer conversar com você'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
