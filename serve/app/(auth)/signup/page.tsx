import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <h1 className="text-4xl font-serif tracking-tight text-foreground">
          SERVÉ
        </h1>
        <h2 className="mt-6 text-center text-2xl font-sans tracking-tight text-foreground">
          Create your restaurant account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" action="#" method="POST">
          <div>
            <label htmlFor="restaurantName" className="block text-sm font-medium leading-6 text-foreground">
              Restaurant Name
            </label>
            <div className="mt-2">
              <input
                id="restaurantName"
                name="restaurantName"
                type="text"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-foreground shadow-sm ring-1 ring-inset ring-[var(--color-brand-charcoal)] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-brand-gold)] sm:text-sm sm:leading-6 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-foreground shadow-sm ring-1 ring-inset ring-[var(--color-brand-charcoal)] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-brand-gold)] sm:text-sm sm:leading-6 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-foreground shadow-sm ring-1 ring-inset ring-[var(--color-brand-charcoal)] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-brand-gold)] sm:text-sm sm:leading-6 bg-transparent"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-[var(--color-brand-nearblack)] dark:bg-[var(--color-brand-ivory)] dark:text-[var(--color-brand-nearblack)] px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-gold)] transition-opacity"
            >
              Apply
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Already a partner?{' '}
          <Link href="/login" className="font-semibold leading-6 text-[var(--color-brand-gold)] hover:text-opacity-80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
