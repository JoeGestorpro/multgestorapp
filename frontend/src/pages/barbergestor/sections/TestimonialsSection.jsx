import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import { TESTIMONIALS } from '../data/testimonials'
import './TestimonialsSection.css'

function StarRating({ rating }) {
  return (
    <div className="bl-testimonial__stars" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? 'var(--gold)' : 'none'} stroke="var(--gold)" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <Section id="depoimentos" className="bl-testimonials">
      <Container>
        <SectionTitle
          label="Prova Social"
          title="Quem usa, recomenda"
          subtitle="Barbearias de todo o Brasil confiam no BarberGestor para gerenciar seu negócio."
        />

        <div className="bl-testimonials__stats">
          {TESTIMONIALS.stats.map((stat) => (
            <ScrollReveal key={stat.label} stagger={1}>
              <div className="bl-testimonials__stat">
                <span className="bl-testimonials__stat-value tabular">{stat.value}</span>
                <span className="bl-testimonials__stat-label">{stat.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="bl-testimonials__grid">
          {TESTIMONIALS.items.map((item, i) => (
            <ScrollReveal key={item.name} stagger={(i % 3) + 2}>
              <div className="bl-testimonial">
                <StarRating rating={item.rating} />
                <p className="bl-testimonial__text">"{item.text}"</p>
                <div className="bl-testimonial__author">
                  <div className="bl-testimonial__avatar">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="bl-testimonial__name">{item.name}</div>
                    <div className="bl-testimonial__role">{item.role}, {item.barbershop}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
