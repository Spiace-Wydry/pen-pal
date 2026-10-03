const PROMPTS: Record<string, string> = {
  'Książki': 'zapytaj o ulubioną książkę z młodości',
  'Ogród': 'zapytaj, co najlepiej rośnie w ogrodzie',
  'Gotowanie': 'zapytaj o przepis zapamiętany z rodzinnego domu',
  'Historia': 'zapytaj, jak wyglądało miasto w czasach młodości',
  'Podróże': 'zapytaj o najpiękniejszą podróż w życiu',
  'Muzyka': 'zapytaj, jakiej muzyki słuchało się na potańcówkach',
  'Sport': 'zapytaj, komu kibicuje od lat',
  'Zwierzęta': 'zapytaj o zwierzę, które pamięta najlepiej',
  'Film': 'zapytaj o film, który warto obejrzeć jeszcze raz',
  'Rękodzieło': 'zapytaj o ulubione robótki ręczne',
  'Technologia': 'zapytaj, jaki wynalazek najbardziej zmienił codzienne życie',
  'Języki obce': 'zapytaj, jakiego języka warto się nauczyć i dlaczego',
  'Fotografia': 'zapytaj o zdjęcie, które ma szczególną historię',
  'Przyroda': 'zapytaj o ulubione miejsce na spacer',
  'Szachy i gry': 'zapytaj, w co grało się kiedyś na podwórku',
}

/** First-letter topic from the first shared interest. (new copy) */
export function topicFor(shared: string[]): { interest: string, prompt: string } | null {
  for (const interest of shared) {
    if (PROMPTS[interest]) {
      return { interest, prompt: PROMPTS[interest] }
    }
  }
  return null
}
