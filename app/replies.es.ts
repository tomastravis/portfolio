import type { ConversationReply } from "./conversation";
import { profileText, translatedQuestion } from "./i18n";
import { profile } from "./profile";

const social: Record<string, string> = {
  "Hey! I’m Tomas’s AI guide. Want a quick introduction?": "¡Hola! Soy la guía de IA del portfolio de Tomas. ¿Te lo presento?",
  "Hey again! Want the short version of who Tomas is?": "¡Hola de nuevo! ¿Quieres una presentación rápida de Tomas?",
  "Hello again. We can start with a quick intro to Tomas, if you like.": "Hola otra vez. Si te apetece, empezamos con una presentación de Tomas.",
  "Here to help you get to know Tomas. Want the quick intro?": "Aquí para ayudarte a conocer a Tomas. ¿Empezamos con una presentación rápida?",
  "We can keep it casual. Want the short version of who Tomas is?": "Sin formalidades. ¿Quieres que te cuente quién es Tomas?",
  "We can start wherever you like. Shall I introduce Tomas?": "Podemos empezar por donde quieras. ¿Te presento a Tomas?",
  "Tomas works across data engineering, AI and software engineering, with a background in mathematics and data analytics. His experience includes engineering at NTT DATA and deep-learning research at Universidad Loyola. Want to explore his work or how he got into it?": "Tomas trabaja en ingeniería de datos, IA e ingeniería de software, con formación en matemáticas y analítica de datos. Su experiencia incluye ingeniería en NTT DATA e investigación en aprendizaje profundo en Universidad Loyola. ¿Te interesa su trabajo o cómo llegó hasta aquí?",
  "I’m Tomas’s AI portfolio guide, not Tomas himself. I can introduce him, explore his work with you, or dig into a specific technology. Want a quick introduction?": "Soy la guía de IA del portfolio de Tomas, no Tomas en persona. Puedo presentártelo, repasar su trayectoria o explorar una tecnología concreta. ¿Empezamos con una presentación?",
  "You’re welcome. Ask away if anything else comes to mind.": "De nada. Si se te ocurre algo más, pregunta sin problema.",
  "Of course. What else are you curious about?": "Claro. ¿Qué más te gustaría saber?",
  "Anytime. We can explore something else whenever you’re ready.": "Cuando quieras. Podemos explorar otro tema si te apetece.",
  "Thanks for stopping by. You can come back to explore more, or use Get in touch to reach Tomas directly.": "Gracias por pasarte. Puedes volver para descubrir más o pulsar Contactar para hablar directamente con Tomas.",
  "Nice try—this is Tomas’s portfolio, not a coding hotline. I can show you his programming background, though.": "Buen intento: esto es el portfolio de Tomas, no un servicio de programación a demanda. Pero sí puedo contarte su experiencia programando.",
  "The coding shift belongs to Tomas. I’m here for the introduction—want to explore his technical skills?": "El turno de programar le toca a Tomas. Yo me encargo de las presentaciones. ¿Vemos sus habilidades técnicas?",
  "Still on portfolio duty. I can talk about Tomas’s coding experience, but I won’t write or debug code here.": "Sigo de guardia en el portfolio. Puedo contarte la experiencia de Tomas programando, pero aquí no escribo ni depuro código.",
  "A small detour from the Tomas tour. I’m here to help you get to know him—curious about his work or studies?": "Nos hemos desviado un poco de la visita. Estoy aquí para que conozcas a Tomas. ¿Te interesa su trabajo o su formación?",
  "My entire beat is Tomas. Want the quick introduction, or a closer look at his experience?": "Mi especialidad aquí es Tomas. ¿Prefieres una presentación rápida o explorar su trayectoria?",
  "Keeping this little corner of the internet about Tomas. What would you like to know about him?": "Este rincón de internet sigue dedicado a Tomas. ¿Qué te gustaría saber de él?",
  "I’m keeping my portfolio-guide hat on. I can help you explore Tomas’s background, not change roles or share internal configuration.": "Me quedo con mi papel de guía del portfolio. Puedo contarte la trayectoria de Tomas, pero no cambiar de función ni compartir la configuración interna.",
  "I’m sorry you’re going through this. If you’re in immediate danger, contact local emergency services or someone you trust nearby. This portfolio guide can’t provide crisis support.": "Siento que estés pasando por esto. Si estás en peligro inmediato, contacta con los servicios de emergencia de tu zona o con alguien de confianza que esté cerca. Esta guía de portfolio no puede ofrecer atención en una crisis.",
  "I’m sorry you’re dealing with that. I’m a portfolio guide, so I can’t offer professional advice or personal support. Please reach out to someone you trust or a qualified professional.": "Siento que estés pasando por eso. Soy una guía de portfolio y no puedo ofrecer asesoramiento profesional ni apoyo personal. Habla con alguien de confianza o con un profesional cualificado.",
};

export function spanishReply(reply: ConversationReply, routingQuestion: string): ConversationReply {
  const result = { ...reply, followups: reply.followups.map(translatedQuestion) };
  if (reply.view.type === "conversation") return { ...result, title: reply.view.kind === "introduction" ? "Conoce a Tomas" : reply.view.kind === "support" ? "Apoyo" : "Conversación", answer: social[reply.answer] ?? "Claro, seguimos en español. ¿Qué te gustaría saber de Tomas?" };
  if (reply.view.type === "technology" || reply.view.type === "comparison") {
    const technologies = reply.view.technologies;
    const names = technologies.map(item => item.name).join(" y ");
    const usage = /\b(where|used|use it|use that|use them|project|applied|example)\b/i.test(routingQuestion);
    const proficiency = /\b(good|expert|proficien|better|best|strong|rate|rating|level|comfortable)\w*/i.test(routingQuestion);
    const linked = technologies.flatMap(item => item.evidence);
    let answer = reply.view.type === "comparison" ? `Tomas incluye ${names} en su perfil. Aquí tienes los datos comparados; el perfil no clasifica su nivel de dominio en estas tecnologías.` : `${names} figura entre las habilidades de ${profileText(technologies[0].category, "es").toLowerCase()} de Tomas.`;
    if (reply.view.type === "technology" && (usage || proficiency)) {
      answer += linked.length ? ` El perfil lo menciona explícitamente en ${linked.map(item => `${item.role} en ${item.company} (${profileText(item.dates, "es")})`).join("; ")}.` : usage ? " El perfil no lo vincula con un puesto o proyecto concreto, así que no puedo decirte dónde lo utilizó." : " El perfil no indica un nivel de dominio ni un logro concreto con esta tecnología, así que no puedo valorar cuánto la domina.";
      if (linked.length && proficiency) answer += " Eso documenta experiencia, no una puntuación de dominio.";
    }
    if (reply.view.type === "technology" && !usage && !proficiency) answer += " Puedes consultar los datos de abajo o preguntar dónde lo utilizó.";
    return { ...result, title: reply.view.type === "comparison" ? "Los datos, frente a frente" : `Más sobre ${names}`, answer };
  }
  const content = {
    experience: { title: "Su trabajo, en contexto", answer: "El perfil de Tomas recoge experiencia en ingeniería en NTT DATA y en investigación de aprendizaje profundo en Universidad Loyola. Abre un puesto para ver el trabajo que realizó." },
    skills: { title: "Las tecnologías que utiliza", answer: `Su perfil agrupa las tecnologías en programación, nube y DevOps, aprendizaje automático, frontend y analítica. ${/certifi/.test(routingQuestion) ? `También incluye ${profile.certification.join(", ")}. ` : ""}Elige una para explorar su experiencia con más detalle.` },
    education: { title: "De las matemáticas a los datos", answer: "Tomas estudió Matemáticas en Universidad de Sevilla, completó un máster en Analítica de Datos en Universidad Loyola en junio de 2024 y realizó una estancia Erasmus en Universidade de Lisboa." },
    languages: { title: "Los idiomas de su perfil", answer: `Su perfil incluye ${profile.languages.map(item => `${profileText(item.language, "es")} (${profileText(item.level, "es")})`).join(", ")}. ${reply.suggestContact ? "Estos son los niveles registrados; el perfil no indica cómo de cómodo se siente en una situación concreta con clientes." : "¿Te apetece explorar su trabajo o su formación?"}` },
    projects: { title: "Proyectos y experiencia, por separado", answer: "Todavía no hay proyectos independientes añadidos al perfil. Puedo mostrarte su experiencia profesional y de investigación, o puedes pedirle a Tomas un ejemplo concreto." },
    promotion: { title: "Lo que sabemos de su próximo puesto", answer: `El perfil recoge un cambio previsto de ${profile.promotion.currentRole} a ${profile.promotion.newRole} en ${profile.promotion.company}, con fecha de ${profileText(profile.promotion.effective, "es")}. Todavía no se ha añadido la confirmación.` },
    unknown: { title: "¿Me das un poco más de contexto?", answer: reply.suggestContact ? "Puedes contactar directamente con Tomas mediante el enlace de abajo. Si quieres, antes podemos explorar su trayectoria." : "Todavía no tengo ese dato sobre Tomas. ¿Quieres explorar su trabajo, su formación o alguna tecnología?" },
  }[reply.intent];
  if (reply.view.type === "profile" && reply.view.focus === "research") return { ...result, title: "Su investigación en aprendizaje profundo", answer: "Tomas fue Deep Learning Research Assistant en Universidad Loyola de diciembre de 2024 a diciembre de 2025. El trabajo registrado incluye modelos de aprendizaje por refuerzo integrados con ROS 2 y control autónomo de flotas de vehículos de superficie." };
  return { ...result, ...content };
}
