import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getAnimes() {

  const animes = await prisma.episodes.findMany()
//   console.log(animes)
  
  return animes

  }


export async function updateEpisode(idAnime, newEp) {

    const animes = await prisma.episodes.update({
        where: { id: idAnime},
        data: { episode: newEp },
    })


}

// getAnimes()