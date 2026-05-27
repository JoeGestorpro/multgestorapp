export const MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=600&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80',
]

export const FALLBACK_COMPANY = {
  description: 'Tradição e estilo se encontram aqui. Há mais de 10 anos cuidando da aparência e autoestima dos nossos clientes com atendimento personalizado e resultados impecáveis.',
  banner_url: '',
  logo_url: null,
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  address: 'Rua Exemplo, 123 - Centro, São Paulo - SP',
  instagram: '@barbeariagestor',
  working_hours: [
    { day: 'Seg a Sex', hours: '08:00 - 19:00' },
    { day: 'Sábado', hours: '08:00 - 17:00' },
    { day: 'Domingo', hours: 'Fechado' },
  ],
  rating: 4.8,
  reviews_count: 127,
  differentials: [
    {
      icon: 'star',
      title: 'Profissionais Experts',
      desc: 'Equipe certificada com anos de experiência no mercado'
    },
    {
      icon: 'shield',
      title: 'Ambiente Premium',
      desc: 'Espaço climatizado, confortável e com estilo industrial'
    },
    {
      icon: 'clock',
      title: 'Pontualidade',
      desc: 'Respeitamos seu horário. Agendamento sem filas'
    },
    {
      icon: 'spray',
      title: 'Produtos Importados',
      desc: 'Linha profissional importada para o melhor cuidado'
    },
  ],
  colors: {
    primary: '#d4a853',
    secondary: '#0c1017',
    accent: '#d4a853',
    button_text: '#000000'
  },
  show_sections: {
    hero: true,
    info: true,
    about: true,
    differentials: true,
    team: true,
    gallery: false
  },
  button_text: 'Agendar Horário',
  slogan: '',
  extra_info: '',
  gallery: []
}

export function buildCompanyData(apiCompany) {
  if (!apiCompany) return { ...FALLBACK_COMPANY }

  const fallback = FALLBACK_COMPANY

  const colors = apiCompany.colors || fallback.colors
  const showSections = apiCompany.show_sections || fallback.show_sections
  const differentials = apiCompany.differentials && apiCompany.differentials.length > 0
    ? apiCompany.differentials
    : fallback.differentials
  const gallery = apiCompany.gallery && apiCompany.gallery.length > 0
    ? apiCompany.gallery
    : []
  const buttonText = apiCompany.button_text || fallback.button_text
  const slogan = apiCompany.slogan || fallback.slogan
  const extraInfo = apiCompany.extra_info || fallback.extra_info

  let workingHours = apiCompany.working_hours
  if (!workingHours || workingHours.length === 0) {
    workingHours = fallback.working_hours
  }

  const description = apiCompany.description || apiCompany.about_text || fallback.description
  const phone = apiCompany.phone || apiCompany.whatsapp || fallback.phone
  const whatsapp = apiCompany.whatsapp || apiCompany.phone || fallback.whatsapp
  const address = apiCompany.address || apiCompany.address_display || fallback.address
  const instagram = apiCompany.instagram || fallback.instagram
  const bannerUrl = apiCompany.banner_url || fallback.banner_url
  const logoUrl = apiCompany.logo_url || fallback.logo_url
  const rating = apiCompany.rating || fallback.rating
  const reviewsCount = apiCompany.reviews_count || fallback.reviews_count

  return {
    id: apiCompany.id,
    name: apiCompany.name || apiCompany.display_name || fallback.name,
    slug: apiCompany.slug,
    description,
    banner_url: bannerUrl,
    logo_url: logoUrl,
    phone,
    whatsapp,
    address,
    instagram,
    working_hours: workingHours,
    rating,
    reviews_count: reviewsCount,
    differentials,
    gallery,
    colors,
    show_sections: showSections,
    button_text: buttonText,
    slogan,
    extra_info: extraInfo
  }
}
