
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Heart, 
  Utensils,
  MessageCircle,
  Star
} from 'lucide-react';
import { formatDistance, formatTime } from '@/lib/utils';

export default function EventCard({ 
  event, 
  onInterest, 
  onMessage,
  showDistance = false, 
  distance,
  matchScore,
  isHost = false,
  showActions = true 
}) {
  const [isInterested, setIsInterested] = useState(false);
  
  if (!event) return null;

  const handleInterest = () => {
    setIsInterested(true);
    onInterest?.(event.id);
  };

<<<<<<< HEAD
=======
  const getDietaryColor = (dietary) => {
    switch (dietary) {
      case 'kosher': return 'bg-blue-100 text-blue-800';
      case 'vegetarian': return 'bg-green-100 text-green-800';
      case 'traditional': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  const getAgeGroupLabel = (ageGroup) => {
    switch (ageGroup) {
      case 'families': return 'Famílias';
      case 'young-adults': return 'Jovens';
      case 'seniors': return 'Seniores';
      case 'mixed': return 'Misto';
      default: return 'Misto';
    }
  };

  const spotsLeft = event.maxGuests - event.currentGuests;

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-1">
              {event.title}
            </CardTitle>
            <CardDescription className="text-sm">
              Por {event.host?.name}
            </CardDescription>
          </div>
          {matchScore && (
            <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              <Star className="h-3 w-3" />
              <span className="text-xs font-medium">
                {Math.round(matchScore * 100)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Event Info */}
        <div className="space-y-2 text-sm">
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
            {showDistance && distance && (
              <Badge variant="secondary" className="text-xs">
                {formatDistance(distance)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{event.currentGuests}/{event.maxGuests} pessoas</span>
            {spotsLeft > 0 && (
              <Badge variant="outline" className="text-xs">
                {spotsLeft} vaga{spotsLeft !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
<<<<<<< HEAD
=======
          <Badge className={getDietaryColor(event.dietary)}>
            <Utensils className="h-3 w-3 mr-1" />
            {event.dietary === 'kosher' ? 'Kosher' : 
             event.dietary === 'vegetarian' ? 'Vegetariano' : 
             event.dietary === 'traditional' ? 'Tradicional' : 'Qualquer'}
          </Badge>
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
          
          <Badge variant="outline">
            {getAgeGroupLabel(event.ageGroup)}
          </Badge>
          
          {event.language && (
            <Badge variant="outline">
              {event.language === 'portuguese' ? 'Português' :
               event.language === 'hebrew' ? 'Hebraico' :
               event.language === 'english' ? 'Inglês' : 'Misto'}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {showActions && !isHost && (
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={handleInterest}
              disabled={isInterested || spotsLeft === 0}
              className="flex-1"
              variant={isInterested ? "outline" : "default"}
            >
              <Heart className={`h-4 w-4 mr-2 ${isInterested ? 'fill-red-500 text-red-500' : ''}`} />
              {isInterested ? 'Interesse Enviado' : 
               spotsLeft === 0 ? 'Esgotado' : 'Tenho Interesse'}
            </Button>
            
            {onMessage && (
              <Button
                onClick={() => onMessage(event.id)}
                variant="outline"
                size="icon"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
