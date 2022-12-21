import type { GetServerSidePropsContext } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "pages/api/auth/[...nextauth]";

const protectPage = async <T>(
	context: GetServerSidePropsContext,
	propsGenerator?: (context: GetServerSidePropsContext) => T
) => {
	const session = await unstable_getServerSession(
		context.req,
		context.res,
		authOptions
	);

	if (!session) {
		return {
			redirect: {
				destination: `/signin?target=${context.resolvedUrl}`,
				permanent: false,
			},
		};
	} else {
		return { props: { session, ...propsGenerator?.(context) } };
	}
};

export default protectPage;
