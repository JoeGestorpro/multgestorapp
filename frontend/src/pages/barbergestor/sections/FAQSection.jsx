import { useState } from 'react'
import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import { FAQ_ITEMS } from '../data/faq'
import './FAQSection.css'

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={`bl-faq__item${isOpen ? ' bl-faq__item--open' : ''}`}>
      <button
        className="bl-faq__question"
        onClick={onToggle}
        aria-expanded={isOpen}
        type="button"
      >
        <span>{item.q}</span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="bl-faq__chevron"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className="bl-faq__answer" style={{ maxHeight: isOpen ? '300px' : '0' }}>
        <p>{item.a}</p>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <Section id="faq" className="bl-faq">
      <Container>
        <SectionTitle
          label="FAQ"
          title="Perguntas frequentes"
          subtitle="Tire suas dúvidas sobre o BarberGestor."
        />

        <div className="bl-faq__list">
          {FAQ_ITEMS.map((item, i) => (
            <ScrollReveal key={i} stagger={Math.min(i + 1, 4)}>
              <FAQItem
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
