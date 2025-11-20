"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div>
			{healthCheck.data ? <h1>{healthCheck.data}</h1> : <h1>Disconnected</h1>}
		</div>
	);
}
