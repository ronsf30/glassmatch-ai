async function test() {
  const url = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4451352369';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  
  const descMatch = html.match(/class="show-more-less-html__markup[^"]*">([\s\S]*?)<\/div>/);
  if (descMatch) {
    const text = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Real Job Description extracted (length:', text.length, '):');
    console.log(text.slice(0, 700));
  } else {
    console.log('No markup match, searching for description section...');
  }
}
test();
