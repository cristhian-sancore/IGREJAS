const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getPublicEvents() {
  try {
    const res = await fetch(`${API_URL}/public/events`, {
      next: { revalidate: 60 }, // Cache por 1 minuto
    });
    if (!res.ok) throw new Error('Falha ao buscar eventos');
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getPublicNews() {
  try {
    const res = await fetch(`${API_URL}/public/news`, {
      next: { revalidate: 300 }, // Cache por 5 minutos
    });
    if (!res.ok) throw new Error('Falha ao buscar notícias');
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}
