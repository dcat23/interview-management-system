import Link from 'next/link';
import { ArrowRight, Briefcase, BookOpen, CalendarCheck, ClipboardCheck } from 'lucide-react';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { PROJECT_NAME } from '@app/atro-ui/lib/constants/metadata';

const ROLES = [
  {
    name: 'Candidates',
    description: 'Track every process you’re in and see what’s next.',
    icon: Briefcase,
  },
  {
    name: 'Marketers',
    description: 'Stand up new interview processes and move candidates through.',
    icon: ClipboardCheck,
  },
  {
    name: 'Supporters',
    description: 'Run sessions, score from the question bank, leave feedback.',
    icon: CalendarCheck,
  },
  {
    name: 'Admins',
    description: 'Own the question bank and oversee every process at a glance.',
    icon: BookOpen,
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-gradient-to-b from-primary/10 via-transparent to-transparent"
      />

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:px-6 md:pt-28 md:pb-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge variant="soft">Interview management, unified</Badge>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            One system for every interview process, start to feedback
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            {PROJECT_NAME} brings candidates, marketers, supporters, and admins onto a single
            platform &mdash; so processes stay on schedule, sessions stay organized, and
            feedback never falls through the cracks.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/login">
                Get started
                <ArrowRight className="h-4 w-4" data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6 text-base">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>

        <div id="roles" className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => (
            <div
              key={role.name}
              className="group rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 transition-colors group-hover:border-primary/50">
                <role.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{role.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
