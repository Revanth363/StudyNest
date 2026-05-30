const CODE_BLOCK_RE = /```([^\n`]*)\n([\s\S]*?)```/g;

const isCodeOnlyContent = (content) => {
  if (!content) return false;
  const trimmed = content.trim();
  return /^```[^\n`]*\n[\s\S]*```$/.test(trimmed);
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
};

const CodeBlock = ({ language, code }) => (
  <div className="formatted-code-block">
    <div className="formatted-code-head">
      {language ? <span className="formatted-code-lang">{language}</span> : <span />}
      <button
        type="button"
        className="formatted-code-copy"
        onClick={(e) => {
          e.stopPropagation();
          copyText(code);
        }}
      >
        Copy code
      </button>
    </div>
    <pre className="formatted-code-pre">
      <code>{code}</code>
    </pre>
  </div>
);

const FormattedContent = ({ content, className = "", codeOnly = false }) => {
  if (!content) return null;

  CODE_BLOCK_RE.lastIndex = 0;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = CODE_BLOCK_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      if (text) {
        nodes.push(
          <span key={`text-${key++}`} className="formatted-content-text">
            {text}
          </span>
        );
      }
    }

    const language = match[1].trim();
    const code = match[2].replace(/\n$/, "");

    nodes.push(
      <CodeBlock key={`code-${key++}`} language={language} code={code} />
    );

    lastIndex = CODE_BLOCK_RE.lastIndex;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex);
    if (text) {
      nodes.push(
        <span key={`text-${key++}`} className="formatted-content-text">
          {text}
        </span>
      );
    }
  }

  if (!nodes.length) return null;

  return (
    <div
      className={`formatted-content ${className}`.trim()}
      data-code-only={codeOnly || isCodeOnlyContent(content) ? "true" : "false"}
    >
      {nodes}
    </div>
  );
};

export default FormattedContent;
