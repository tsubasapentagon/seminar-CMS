'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Seminar } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// SeminarCardコンポーネント
const SeminarCard = ({ seminar, onScheduleClick }: { seminar: Seminar, onScheduleClick: () => void }) => (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg bg-white">
        <CardHeader className="p-0">
            <img src={seminar.banner_url || 'https://placehold.co/400x225/e2e8f0/e2e8f0'} alt={seminar.title} className="w-full h-44 object-cover" />
        </CardHeader>
        <CardContent className="flex-grow p-4">
            <CardTitle className="text-lg mb-2 line-clamp-2 h-[56px] font-bold">{seminar.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
                {seminar.industries?.name && <Badge variant="secondary">{seminar.industries.name}</Badge>}
                {seminar.online && <Badge variant="outline">オンライン</Badge>}
            </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
            <Button className="w-full" onClick={onScheduleClick}>開催日程を確認する</Button>
        </CardFooter>
    </Card>
);

type PropType = {
  seminars: Seminar[];
  onSeminarClick: (seminar: Seminar) => void;
};

export function SeminarCarousel({ seminars, onSeminarClick }: PropType) {
  const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true }));
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'center',
    // containScroll: 'trimSnaps'
  }, [autoplayPlugin.current]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onInit = useCallback((emblaApi: any) => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 h-[450px]">
          {seminars.map((seminar, index) => (
            <div 
              className={`relative flex-shrink-0 flex-grow-0 basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[35%] pl-4`}
              key={`${seminar.id}-${index}`}
            >
              <div 
                className={`p-1 h-full embla__slide ${index === selectedIndex ? 'is-selected' : ''}`}
              >
                <SeminarCard seminar={seminar} onScheduleClick={() => onSeminarClick(seminar)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-1/2 left-0 right-0 flex justify-between items-center -translate-y-1/2 px-2 sm:px-4 pointer-events-none">
        <Button onClick={scrollPrev} className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 pointer-events-auto" variant="outline"><ArrowLeft /></Button>
        <Button onClick={scrollNext} className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 pointer-events-auto" variant="outline"><ArrowRight /></Button>
      </div>

      <div className="absolute bottom-[-2.5rem] left-1/2 -translate-x-1/2 flex gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === selectedIndex ? 'w-6 bg-primary' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
