import type { GetServerSidePropsContext } from "next";
import type { ClientSafeProvider } from "next-auth/react";

import { unstable_getServerSession } from "next-auth";
import { getProviders, signIn } from "next-auth/react";
import { authOptions } from "./api/auth/[...nextauth]";
import {
	Box,
	Button,
	Divider,
	Text,
	Input,
	InputGroup,
	InputLeftElement,
	useToken,
} from "@chakra-ui/react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { RiLockPasswordLine, RiMailFill } from "react-icons/ri";

const IS_DEBUG = process.env.NODE_ENV === "development";

const ProviderIcons = {
	google: <FaGoogle />,
	github: <FaGithub />,
} as const;

type SignInPageProps = {
	providers: Array<ClientSafeProvider>;
	callbackUrl: string;
};

export default function SignIn({ providers, callbackUrl }: SignInPageProps) {
	const [text100, text500, brand500] = useToken("colors", [
		"text.100",
		"text.500",
		"brand.800",
	]);
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
				h={["100vh", null, "fit-content"]}
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
								onClick={() => signIn(provider.id, { callbackUrl })}
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

	if (!session) {
		const providers = await getProviders();

		return {
			props: {
				providers: Object.values(providers || {}),
				callbackUrl: `${IS_DEBUG ? "http" : "https"}://${
					context.req.headers.host
				}${context.query.target}`,
			},
		};
	} else {
		return {
			redirect: {
				destination: "/app/editor",
				permanent: false,
			},
		};
	}
}
