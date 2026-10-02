import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Extract head contents
head_match = re.search(r'<head>(.*?)</head>', index_html, re.DOTALL)
head_content = head_match.group(1) if head_match else ''

# Extract header
header_match = re.search(r'<header class="site-header">.*?</header>', index_html, re.DOTALL)
header_content = header_match.group(0) if header_match else ''
# add styling to header to make it visible on light pages
header_content = header_content.replace('<header class="site-header">', '<header class="site-header" style="background: var(--ink);">')
header_content = header_content.replace('href="#" class="nav-login"', 'href="#" class="nav-login" style="color: var(--surface);"')
header_content = header_content.replace('class="nav-links"', 'class="nav-links" style="--nav-link-color: var(--surface);"')

# We will just inject some inline CSS in the new page head for the nav-links
extra_head = """
  <link href="css/page.css" rel="stylesheet">
  <style>
    .site-nav .nav-links a { color: var(--surface) !important; }
    .site-nav .logo-ace, .site-nav .logo-iiit { color: var(--surface) !important; }
  </style>
"""
head_content = head_content.replace('</title>', '</title>' + extra_head)

# Extract footer
footer_match = re.search(r'<footer class="site-footer">.*?</footer>', index_html, re.DOTALL)
footer_content = footer_match.group(0) if footer_match else ''

pages = {
    'privacy.html': {
        'title': 'Privacy Policy',
        'subtitle': 'Last updated: September 2026',
        'content': '''
        <h2>1. Information We Collect</h2>
        <p>At AceIIIT, we collect information that you provide directly to us when you register for an account, subscribe to our courses, or communicate with us. This includes your name, email address, phone number, and payment information.</p>
        
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services.</li>
          <li>Process transactions and send related information.</li>
          <li>Send you technical notices, updates, and support messages.</li>
          <li>Respond to your comments, questions, and requests.</li>
        </ul>

        <h2>3. Sharing of Information</h2>
        <p>We do not share, sell, or rent your personal information to third parties. Your data is used exclusively to provide and improve the AceIIIT platform.</p>

        <h2>4. Data Security</h2>
        <p>We implement industry-standard security measures to protect your personal information. However, no transmission over the internet is completely secure, and we cannot guarantee absolute security.</p>

        <h2>5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at <a href="contact.html">Contact Support</a>.</p>
        '''
    },
    'terms.html': {
        'title': 'Terms of Service',
        'subtitle': 'Effective Date: September 2026',
        'content': '''
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using AceIIIT, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

        <h2>2. Use of Service</h2>
        <p>You agree to use our services for lawful purposes only. You are prohibited from sharing your account credentials, distributing our course materials without authorization, or attempting to compromise our system's integrity.</p>

        <h2>3. Intellectual Property</h2>
        <p>All content on the AceIIIT platform, including text, graphics, logos, and video materials, is the property of AceIIIT and is protected by copyright laws.</p>

        <h2>4. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

        <h2>5. Modifications to Service</h2>
        <p>We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or any third party for any modification.</p>
        '''
    },
    'refund.html': {
        'title': 'Refund Policy',
        'subtitle': 'Our commitment to student satisfaction',
        'content': '''
        <h2>1. 7-Day Money-Back Guarantee</h2>
        <p>We stand by the quality of our UGEE preparation materials. If you are not satisfied with your purchase, you may request a full refund within 7 days of your initial payment.</p>

        <h2>2. Eligibility Criteria</h2>
        <p>To be eligible for a refund, you must:</p>
        <ul>
          <li>Submit your request within 7 days of purchase.</li>
          <li>Not have completed more than 20% of the course material.</li>
          <li>Not have downloaded excessive proprietary resources.</li>
        </ul>

        <h2>3. Process for Requesting a Refund</h2>
        <p>To request a refund, please reach out via our <a href="contact.html">Contact Support</a> page with your order details and reason for the refund. Our team will review your request within 2-3 business days.</p>

        <h2>4. Non-refundable Items</h2>
        <p>Certain items are strictly non-refundable, including one-on-one mentorship sessions that have already been conducted and individual mock test purchases once they have been attempted.</p>
        '''
    },
    'about.html': {
        'title': 'About Us',
        'subtitle': 'The team behind AceIIIT',
        'content': '''
        <h2>Our Mission</h2>
        <p>AceIIIT was founded with a singular focus: to help students prepare for the exam that actually matters. We believe that UGEE demands a different kind of preparation—one that focuses on reasoning, curiosity, and impact rather than rote memorization.</p>

        <h2>Why We Started</h2>
        <p>We noticed a massive gap in the market. While thousands of institutes prepare students for traditional engineering exams, few understand the unique requirements of the UGEE. We built AceIIIT to fill that gap, providing specialized resources, mock tests, and mentorship tailored specifically for this exam.</p>

        <h2>Our Approach</h2>
        <p>Our methodology is built on three pillars:</p>
        <ul>
          <li><strong>Targeted Content:</strong> We cut the fluff and focus only on what you need to crack the exam.</li>
          <li><strong>Realistic Diagnostics:</strong> Our mock tests are designed to mimic the exact difficulty and pattern of the UGEE.</li>
          <li><strong>Expert Mentorship:</strong> Learn from individuals who have successfully navigated the process themselves.</li>
        </ul>

        <h2>Join Us</h2>
        <p>Whether you're a 95 or 99 percentiler, if you're aiming for the top, you're in the right place. Let's conquer the UGEE together.</p>
        '''
    },
    'contact.html': {
        'title': 'Contact Support',
        'subtitle': 'We are here to help you succeed',
        'content': '''
        <p style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">Have questions about our courses, need technical assistance, or just want to say hi? Choose the best way to reach us below.</p>
        
        <div class="contact-grid">
          <div class="contact-card">
            <h3>Email Support</h3>
            <p>For general inquiries, account issues, and billing.</p>
            <a href="mailto:support@aceiiit.com">support@aceiiit.com</a>
          </div>
          <div class="contact-card">
            <h3>Discord Community</h3>
            <p>Join our active community of students and mentors.</p>
            <a href="#">Join Discord</a>
          </div>
          <div class="contact-card">
            <h3>Mentorship Hotline</h3>
            <p>For enrolled students needing urgent academic guidance.</p>
            <a href="tel:+919876543210">+91 98765 43210</a>
          </div>
          <div class="contact-card">
            <h3>Business Inquiries</h3>
            <p>For partnerships, press, and institutional access.</p>
            <a href="mailto:hello@aceiiit.com">hello@aceiiit.com</a>
          </div>
        </div>
        '''
    }
}

template = """<!DOCTYPE html>
<html lang="en">
<head>
{head}
</head>
<body>
{header}

  <main class="page-main">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{title}</h1>
        <p class="page-subtitle">{subtitle}</p>
      </div>
      <div class="page-content">
        {content}
      </div>
    </div>
  </main>

{footer}
</body>
</html>
"""

for filename, data in pages.items():
    page_html = template.format(
        head=head_content.replace('<title>ACEIIIT | Prepare for the exam that actually matters</title>', f'<title>ACEIIIT | {data["title"]}</title>'),
        header=header_content,
        title=data['title'],
        subtitle=data['subtitle'],
        content=data['content'],
        footer=footer_content
    )
    # Fix the links to point to the actual pages in the footer
    page_html = page_html.replace('href="#">Privacy Policy</a>', 'href="privacy.html">Privacy Policy</a>')
    page_html = page_html.replace('href="#">Terms of Service</a>', 'href="terms.html">Terms of Service</a>')
    page_html = page_html.replace('href="#">Refund Policy</a>', 'href="refund.html">Refund Policy</a>')
    page_html = page_html.replace('href="#">About Us</a>', 'href="about.html">About Us</a>')
    page_html = page_html.replace('href="#">Contact Support</a>', 'href="contact.html">Contact Support</a>')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(page_html)

print("Pages generated successfully.")
