import asyncio
import bs4

from aiohttp import ClientSession, TCPConnector

url = "https://www.goodrx.com/"

async def send_request(session: ClientSession, url: str) -> str:
    async with session.get(url) as response:
        return await response.text()

async def main():
    connector = TCPConnector(limit=100, limit_per_host=30, force_close=False)
    async with ClientSession(connector=connector, max_line_size=16384, max_field_size=16384) as session:
        tasks = [send_request(session, url) for _ in range(1)]
        results = await asyncio.gather(*tasks)
        print(results)

    # write last response to file
    with open("last_response.html", "w") as f:
        f.write(bs4.BeautifulSoup(results[-1], "html.parser").prettify())

if __name__ == "__main__":
    asyncio.run(main())