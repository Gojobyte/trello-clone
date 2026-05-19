import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { LayoutGrid, Sparkles, Users } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Landing })

function Landing() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session?.user) {
      navigate({ to: '/boards' })
    }
  }, [isPending, session, navigate])

  if (isPending || session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />

      <header className="relative z-10 container mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Trello Clone</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Commencer gratuitement</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto flex flex-col items-center px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-muted-foreground">
            Collaboration en temps réel
          </span>
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Organise tes projets,{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
            une carte à la fois.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Crée des tableaux Kanban, ajoute des listes et des cartes, déplace-les
          par drag &amp; drop. Tout est sauvegardé en temps réel.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="text-base">
            <Link to="/register">Créer un compte</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link to="/login">J'ai déjà un compte</Link>
          </Button>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <Feature
            icon={<LayoutGrid className="h-5 w-5" />}
            title="Tableaux Kanban"
            description="Visualise ton flux de travail avec des colonnes personnalisables."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="Temps réel"
            description="Tes modifications apparaissent instantanément sur tous les appareils."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="Collaboration"
            description="Invite ton équipe à travailler sur les mêmes tableaux."
          />
        </div>
      </main>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-background/60 p-6 text-left backdrop-blur">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
