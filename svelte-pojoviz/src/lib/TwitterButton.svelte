<script>
  export let tweetText = '';
  export let via = '';
  export let hashtag = '';

  let iframeSrc = '';

  $: {
    const params = new URLSearchParams();
    params.append('count', 'horizontal');
    params.append('id', 'twitter-widget-0');
    params.append('lang', 'en');
    params.append('original_referer', encodeURIComponent(window.location.href));
    params.append('size', 'm');
    params.append('text', tweetText || document.title);
    params.append('url', encodeURIComponent(window.location.href));
    if (hashtag) params.append('hashtags', hashtag);
    if (via) params.append('via', via);

    iframeSrc = 'https://platform.twitter.com/widgets/tweet_button.html?' + params.toString();
  }
</script>

<iframe
  scrolling="no"
  frameborder="0"
  allowtransparency="true"
  src={iframeSrc}
  title="Twitter Tweet Button"
  style="width: 110px; height: 20px;"
></iframe>

<style>
  /* Add any specific styling for your twitter button here */
</style>
