import type { GetServerSidePropsContext } from "next";
import type { ClientSafeProvider } from "next-auth/react";

import {
	Box,
	Button,
	Divider,
	Input,
	InputGroup,
	InputLeftElement,
	Text,
	useToken,
} from "@chakra-ui/react";
import { unstable_getServerSession } from "next-auth";
import { getProviders, signIn } from "next-auth/react";
import { useCallback } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { RiLockPasswordLine, RiMailFill } from "react-icons/ri";
import { authOptions } from "./api/auth/[...nextauth]";

const ProviderIcons = {
	google: <FaGoogle />,
	github: <FaGithub />,
} as const;

const ErrorMessages = {
	Configuration:
		"There is a problem with the server configuration. Check if your options are correct.",
	AccessDenied:
		"Usually occurs, when you restricted access through the signIn callback, or redirect callback",
	Verification:
		"Related to the Email provider. The token has expired or has already been used",
	Default: "Something went wrong :(",
	OAuthSignin: "Error in constructing an authorization URL (1, 2, 3)",
	OAuthCallback:
		"Error in handling the response (1, 2, 3) from an OAuth provider.",
	OAuthCreateAccount: "Could not create OAuth provider user in the database.",
	EmailCreateAccount: "Could not create email provider user in the database.",
	Callback: "Error in the OAuth callback handler route",
	OAuthAccountNotLinked:
		"The email on the account is already linked, but not with this OAuth account",
	EmailSignin: "Sending the e-mail with the verification token failed",
	CredentialsSignin: `The authorize callback returned null in the Credentials provider. We don't recommend providing information about which part of the credentials were wrong, as it might be abused by malicious hackers.`,
	SessionRequired:
		"The content of this page requires you to be signed in at all times. See useSession for configuration.",
};

type ErrorCode = keyof typeof ErrorMessages;

type SignInPageProps = {
	providers: Array<ClientSafeProvider>;
	error: ErrorCode | null;
};

export default function SignIn({ providers = [], error }: SignInPageProps) {
	const [text100] = useToken("colors", ["text.100", "text.500", "brand.800"]);

	const signInWithProvider = useCallback(async (provider: string) => {
		signIn(provider, { redirect: false });
	}, []);

	return (
		<Box
			w="100vw"
			h="100vh"
			display="flex"
			alignItems="center"
			justifyContent="center"
			p={0}
			m={0}
		>
			<Box
				display="flex"
				flexDir={["column", null, "row"]}
				w={["100%", "800px"]}
				h={["100%", null, "fit-content"]}
			>
				<Box
					display="flex"
					w={[null, null, "60%"]}
					h={["60%", null, "auto"]}
					alignItems="center"
					borderColor="text.100"
					borderWidth={["0px", null, "0px 1px 1px 1px"]}
					justifyContent="center"
					color="#FFFFFF"
					bg="brand.500"
					borderLeftRadius={["0px", null, "5px"]}
				>
					<Text fontSize="7rem">YiLang</Text>
				</Box>
				<Box
					mt={["auto", null, "0"]}
					display="flex"
					flexDir="column"
					w={[null, null, "40%"]}
					gap={4}
					p={4}
					borderColor="text.100"
					borderWidth={["0px", null, "1px 1px 1px 0px"]}
					borderRightRadius="5px"
					justifyContent="center"
				>
					{error && (
						<>
							<Box>
								<Text color="red" fontWeight="bold">
									Error
								</Text>
								<Text color="red">{ErrorMessages[error]}</Text>
							</Box>
							<Divider />
						</>
					)}
					<Box w="100%" display="flex" flexDir="column" gap={4}>
						<InputGroup>
							<InputLeftElement pointerEvents="none">
								<RiMailFill color={text100} />
							</InputLeftElement>
							<Input type="email" placeholder="Email" colorScheme="brand" />
						</InputGroup>
						<InputGroup>
							<InputLeftElement pointerEvents="none">
								<RiLockPasswordLine color={text100} />
							</InputLeftElement>
							<Input
								colorScheme="brand"
								type="password"
								placeholder="Password"
							/>
						</InputGroup>
						<Button colorScheme="brand" w="100%">
							Sign In
						</Button>
					</Box>
					<Divider />
					{Object.values(providers).map((provider) => (
						<div key={provider.name}>
							<Button
								variant="outline"
								w="100%"
								colorScheme="brand"
								rightIcon={
									ProviderIcons[
										provider.name.toLowerCase() as keyof typeof ProviderIcons
									]
								}
								onClick={() => signInWithProvider(provider.id)}
							>
								Sign in with {provider.name}
							</Button>
						</div>
					))}
				</Box>
			</Box>
		</Box>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await unstable_getServerSession(
		context.req,
		context.res,
		authOptions
	);

	const error = context.query.error || null;
	const target = context.query.target || null;

	if (!session || !session.user) {
		const providers = await getProviders();

		return {
			props: {
				providers: Object.values(providers || {}),
				error,
			},
		};
	} else {
		return {
			redirect: {
				destination: target || "/app/editor",
				permanent: false,
			},
		};
	}
}
