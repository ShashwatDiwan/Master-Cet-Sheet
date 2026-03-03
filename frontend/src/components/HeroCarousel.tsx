import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"

interface Slide {
  title: string
  description: string
  image?: string
  gradient: string
  link: string
}

interface HeroCarouselProps {
  slides: Slide[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  return (
    <div className="w-full relative px-12">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card className={`overflow-hidden border-none bg-gradient-to-br ${slide.gradient} h-full min-h-[180px] sm:min-h-[220px] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
                  <CardContent className="flex flex-col justify-between p-6 h-full text-white">
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{slide.title}</h3>
                      <p className="text-white/80 text-sm sm:text-base line-clamp-2">
                        {slide.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        {slide.image && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                <img src={slide.image} alt={slide.title} className="w-full h-full object-contain" />
                            </div>
                        )}
                        <Button variant="secondary" size="sm" className="rounded-full bg-white text-black hover:bg-white/90">
                            Explore <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-12 border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10" />
        <CarouselNext className="hidden sm:flex -right-12 border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10" />
      </Carousel>
    </div>
  )
}
