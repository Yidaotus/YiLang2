import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";
import Link from "next/link";

const NavBar = () => (
	<div className="navbar bg-base-100">
		<div className="navbar-start">
			<div className="dropdown">
				<label tabIndex={0} className="btn-ghost btn-circle btn">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M4 6h16M4 12h16M4 18h7"
						/>
					</svg>
				</label>
				<ul
					tabIndex={0}
					className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
				>
					<li>
						<Link href="/">Home</Link>
					</li>
					<li>
						<Link href="/dictionary">Dictionary</Link>
					</li>
					<li>
						<Link href="/documents">Documents</Link>
					</li>
				</ul>
			</div>
		</div>
		<div className="navbar-center">
			<a className="btn-ghost btn text-xl normal-case">YiLang 2.0</a>
		</div>
		<div className="navbar-end">
			<button className="btn-ghost btn-circle btn">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</button>
			<button className="btn-ghost btn-circle btn">
				<div className="indicator">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
						/>
					</svg>
					<span className="badge-primary badge badge-xs indicator-item"></span>
				</div>
			</button>
			<div className="dropdown dropdown-end">
				<label tabIndex={0} className="btn-ghost btn-circle avatar btn">
					<div className="w-10 rounded-full">
						<img src="https://placeimg.com/80/80/people" />
					</div>
				</label>
				<ul
					tabIndex={0}
					className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
				>
					<li>
						<a className="justify-between">
							Profile
							<span className="badge">New</span>
						</a>
					</li>
					<li>
						<a>Settings</a>
					</li>
					<li>
						<a>Logout</a>
					</li>
				</ul>
			</div>
		</div>
	</div>
);

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps },
}) => {
	return (
		<SessionProvider session={session}>
			<NavBar />
			<Component {...pageProps} />
		</SessionProvider>
	);
};

export default trpc.withTRPC(MyApp);
