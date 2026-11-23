# Custom domain cutover

Keep the github.io preview active until the domain owner is ready. In organization Settings → Pages → Add a domain, enter `erp4us.org`. Publish GitHub's unique TXT at `_github-pages-challenge-erp4us-org.erp4us.org`, verify it and keep the record. In the website repository Settings → Pages set the custom domain to `erp4us.org` **before** changing routing DNS. Actions deployments use the Pages setting, not a CNAME file.

| Type  | Name | Values (one record per value)                                                      |
| ----- | ---- | ---------------------------------------------------------------------------------- |
| A     | @    | 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153                 |
| AAAA  | @    | 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153 |
| CNAME | www  | erp4us-org.github.io.                                                              |

Remove conflicting routing records only after owner review. Do not use wildcard records. Check `dig +short erp4us.org A`, `dig +short erp4us.org AAAA` and `dig +short www.erp4us.org CNAME`. Wait for the Pages certificate, enable Enforce HTTPS, and test the apex and www redirect. Update community website links to the apex once verified. If retiring Pages remove routing DNS before releasing the domain binding.

Reserved, not active: docs (documentation), demo (public walkthrough), dev (private development), status (service status), argocd (private administration). Do not create records for these names now.

Source: [GitHub Pages custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

After cutover, set the repository Actions variable `SITE_URL=https://erp4us.org` and rerun the Website workflow to update canonical, alternate and social URLs. Until then they use the live github.io site.
