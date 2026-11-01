export type Language = "en" | "es";
export const speechLanguage = { en: "en-US", es: "es-ES" } as const;

export function normaliseText(text: string) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f\u200B-\u200D\uFEFF]/g, "").toLowerCase().replace(/[’‘]/g, "'").replace(/[¿¡?!.,;:]/g, " ").replace(/\s+/g, " ").trim();
}

export function explicitLanguage(text: string): Language | null {
  const value = normaliseText(text);
  const directive = "^(?:(?:please|por favor) )?(?:(?:can|could|would) (?:you|we) |puedes |podemos )?(?:(?:answer|respond|reply|continue|speak|talk|switch)(?: in| to)?|(?:responde|contesta|habla|hablemos|hablar|cambia|cambiar|sigue|continua)(?: en| al| a)) ";
  if (new RegExp(`${directive}(?:english|ingles)\\b`).test(value) || /^(?:in english|en ingles|english please|ingles por favor)\b/.test(value) || /^hablemos ingles$/.test(value)) return "en";
  if (new RegExp(`${directive}(?:spanish|espanol)\\b`).test(value) || /^(?:en espanol|in spanish|spanish please|espanol por favor)\b/.test(value) || /^hablemos espanol$/.test(value)) return "es";
  return null;
}

export function languageFor(text: string, fallback: Language = "en"): Language {
  const explicit = explicitLanguage(text);
  if (explicit) return explicit;
  const value = normaliseText(text);
  const spanish = (value.match(/\b(?:hola|buenas|gracias|adios|quien|que|cual|donde|como|habla|hablame|compara|explica|explicame|escribeme|escribir|crear|genera|programar|es|el|su|sus|con|lo|y|tiene|sabe|puede|puedes|escribe|hazme|cuentame|muestrame|estudio|experiencia|idiomas|espanol|ingles|mas|si|vale|quiero|ignora|estoy)\b/g) ?? []).length;
  const english = (value.match(/\b(?:hello|hey|hi|thanks|who|what|which|where|how|is|he|his|has|does|can|could|write|show|tell|experience|languages|please|yes|more|ignore)\b/g) ?? []).length;
  return spanish > english ? "es" : english > spanish ? "en" : fallback;
}

// A bounded bilingual routing vocabulary, not a general translation service.
// Only routing text is normalised; source facts and the visitor's message stay intact.
export function toRoutingEnglish(text: string): string {
  let value = normaliseText(text);
  value = value.replace(/^(?:please )?(?:(?:can|could|would) (?:you|we) )?(?:answer|respond|reply|continue|speak|talk|switch)(?: in| to)? (?:spanish|english)(?: please)?\b/, "");
  const phrases: [RegExp, string][] = [
    [/\b(?:responde|contesta|habla|hablemos|cambia|cambiar|sigue|continua)(?: en| al| a) (?:espanol|ingles)\b/g, ""],
    [/\bhablemos (?:espanol|ingles)\b/g, ""],
    [/\b(?:en espanol|en ingles|in spanish|in english|spanish please|english please|switch to spanish|switch to english)\b/g, ""],
    [/\b(?:buenos dias|buenas tardes|buenas noches|buenas)\b/g, "hello"],
    [/\b(?:que tal|como estas|como te va|que pasa)\b/g, "how are you"],
    [/\b(?:quien es|quien es el)\b/g, "who is"],
    [/\b(?:a que se dedica|que hace) (?:tomas(?: travis)?|el)\b/g, "what does he do"],
    [/\b(?:a que se dedica|que hace)\b/g, "what does he do"],
    [/\bque sabes (?:de|sobre) (?:tomas(?: travis)?|el)\b/g, "tell me about tomas"],
    [/\b(?:quien eres|eres una persona|eres humano)\b/g, "who are you"],
    [/\beres tomas\b/g, "are you tomas"],
    [/\b(?:puedes hacer|que puedes hacer)\b/g, "what can you do"],
    [/\b(?:presentame a|presenta a)\b/g, "introduce"],
    [/\b(?:cuentame|hablame)(?: un poco)? (?:sobre|de)\b/g, "tell me about"],
    [/\b(?:dame una introduccion|una introduccion|introduccion rapida)\b/g, "quick introduction"],
    [/\b(?:donde|en que proyecto|en que trabajo) (?:lo |la |los |las )?(?:uso|utilizo|ha usado|ha utilizado)\b/g, "where did he use it"],
    [/\b(?:lo ha usado|ha usado eso)\b/g, "where did he use it"],
    [/\b(?:que estudio|donde estudio)\b/g, "what did he study"],
    [/\b(?:donde trabajo|en que trabaja|que experiencia tiene)\b/g, "show me his experience"],
    [/\b(?:que idiomas habla|habla idiomas)\b/g, "what languages does he speak"],
    [/\bes bueno\b/g, "is he good"], [/\bes experta?o?\b/g, "is he expert"],
    [/\b(?:sabe programar|puede programar)\b/g, "can he write code"],
    [/\bpuedes programar\b/g, "can you write code"],
    [/\b(?:tiene experiencia|ha trabajado)\b/g, "has he worked"],
    [/\b(?:que hay de|y que tal|y sobre|y)(?=\s+(?:python|pyspark|spark|sql|aws|kubernetes|typescript)\b)/g, "what about"],
    [/\b(?:cuentame mas|dime mas|mas detalles|ver mas)\b/g, "tell me more"],
    [/\b(?:hazlo igualmente|hazlo de todos modos|solo esta vez|hazlo por favor)\b/g, "do it anyway"],
    [/\b(?:ahora eres|a partir de ahora eres)\b/g, "you are now"],
    [/\b(?:actua como|finge ser)\b/g, "act as"],
    [/\b(?:prompt del sistema|mensaje del sistema)\b/g, "system prompt"],
    [/\b(?:clave de api|clave api)\b/g, "api key"],
    [/\b(?:quiero morir|quiero matarme|quiero suicidarme|hacerme dano)\b/g, "want to die"],
    [/\b(?:estoy deprimido|estoy deprimida|estoy de duelo|estoy asustado|estoy asustada)\b/g, "i am depressed"],
    [/\b(?:mi padre murio|mi madre murio)\b/g, "my dad died"],
    [/\bnecesito (?:ayuda|consejo) (?:medico|medica|legal)\b/g, "i need medical advice"],
    [/\b(?:por favor|si por favor)\b/g, "please"],
  ];
  for (const [pattern, replacement] of phrases) value = value.replace(pattern, replacement);
  value = value.replace(/\bclientes\b/g, "clients");
  value = value.replace(/\bhabla\b/g, "does he speak");
  value = value.replace(/\b(?:ensenarme|nube|contactar)\b/g, word => ({ ensenarme: "teach me", nube: "cloud", contactar: "contact" })[word]!);
  value = value.replace(/\b(?:escribir|crear|generar|implementar|ejecutar|depurar|arreglar|programar|sabe|tiene|haz|mi)\b/g, word => ({ escribir: "write", crear: "create", generar: "generate", implementar: "implement", ejecutar: "run", depurar: "debug", arreglar: "fix", programar: "write code", sabe: "does he know", tiene: "has he", haz: "make", mi: "my" })[word]!);
  const words: Record<string, string> = { hola: "hello", gracias: "thanks", adios: "goodbye", perfecto: "perfect", vale: "okay", genial: "great", si: "yes", el: "he", su: "his", sus: "his", sobre: "about", con: "with", quien: "who", cual: "which", que: "what", donde: "where", como: "how", experiencia: "experience", trabajo: "work", trayectoria: "career", estudios: "education", formacion: "education", habilidades: "skills", tecnologias: "technologies", herramientas: "tools", investigacion: "research", robotica: "robotics", proyectos: "projects", proyecto: "project", idiomas: "languages", idiomasque: "languages", espanol: "spanish", ingles: "english", frances: "french", portugues: "portuguese", ascenso: "promotion", certificacion: "certification", contacto: "contact", correo: "email", contratar: "hire", muestrame: "show me", muestra: "show me", dime: "tell me", cuentame: "tell me", compara: "compare", explica: "explain", explicame: "explain", describe: "describe", escribeme: "write me", escribe: "write", hazme: "make me", crea: "create", genera: "generate", arregla: "fix", depura: "debug", ensename: "teach me", necesito: "i need", codigo: "code", funcion: "function", aplicacion: "app", web: "website", consulta: "query", deberes: "homework", tarea: "homework", poema: "poem", receta: "recipe", viaje: "trip", vacaciones: "holiday", traduce: "translate", resume: "summarise", ignora: "ignore", olvida: "forget", revela: "reveal", muestrael: "show", instrucciones: "instructions", reglas: "rules", anteriores: "previous", previas: "previous", tus: "your", buen: "good", bueno: "good", experto: "expert", nivel: "level", dominio: "proficiency", comodo: "comfortable", cliente: "client", puede: "can he", puedes: "can you", usado: "used", uso: "used", usar: "use", mas: "more", eso: "it", lo: "it", tambien: "also", luego: "then" };
  return value.replace(/\b[a-z]+\b/g, word => words[word] ?? word).replace(/\s+/g, " ").trim();
}

export const ui = {
  en: {
    language: "Language", home: "Tomas Travis home", contact: "Get in touch", kicker: "A different way to get to know me", intro: "A conversation, not a résumé.", introMore: "Ask about my work. See the story take shape.", experience: "My experience", skills: "What I work with", education: "My education", askExperience: "Show me his experience", askSkills: "What technologies does he use?", askEducation: "What did he study?", suggested: "Suggested questions", conversation: "Conversation with Tomas Travis AI", preparing: "Preparing", updated: "Updated", answer: "Answer", source: "From my profile", direct: "Ask Tomas directly", retry: "Retry this question", followups: "Continue the conversation", checking: "Checking the profile…", stopResponse: "Stop response", ask: "Ask about Tomas", placeholder: "What would you like to know?", listening: "Listening…", stopRecording: "Stop recording", dictate: "Dictate a question", send: "Send question", listeningHint: "Listening · tap stop to finish", tagline: "Your questions. My experience.", spoken: "Spoken replies", on: "on", off: "off", stopSpeaking: "Stop speaking", footer: "Data engineering. AI. Software.", built: "Built around a conversation.", pause: "Pause visual", resume: "Resume visual", role: "Explore this role", listed: "Listed in profile", confirms: "What the profile confirms", evidence: "Skill + work evidence", listedSkill: "Listed skill", viewSource: "View source", sourceCaveat: "Only explicit mentions in role descriptions are linked here. A listed skill alone doesn’t establish proficiency or a project outcome.", noProjects: "Project details haven’t been added to this profile yet.", askWork: "Ask Tomas about his work.", planned: "The profile records a planned move from Junior Engineer to Engineer at NTT DATA, effective September 2026. Confirmation of the change hasn’t been added.", empty: "Ask about Tomas’s work, studies, languages or a technology.", noSpeech: "Spoken replies aren’t available in this browser. You can read every answer here.", noVoice: "A voice for this language isn’t available on this device. The answer is still on screen.", audioStopped: "Audio playback stopped. The full answer is available on screen.", noRecognition: "Voice input isn’t available in this browser. Try your phone keyboard’s dictation button, or type below.", permission: "Microphone access wasn’t allowed. You can enable it in browser settings or keep typing.", capture: "I couldn’t capture that. Please try again or type your question.", privacy: "Your browser may use its speech service to transcribe audio. Review the text before sending.", startVoice: "Voice input couldn’t start. Please type your question instead.", rateLimit: "Too many questions. Please wait a moment and retry.", connection: "The assistant service couldn’t connect. You can still explore the saved profile evidence.", unexpected: "The assistant returned an unexpected answer. The saved facts are shown instead.", aiUnavailable: "The AI service is unavailable; this answer uses the saved profile.", interrupted: "The response was interrupted. The saved profile is available below.", stopped: "Stopped. Your question and its matching profile evidence are kept here.", timeout: "The response took too long. Here’s the matching saved profile evidence.", inputError: "Please enter a question of up to 240 characters.",
  },
  es: {
    language: "Idioma", home: "Inicio de Tomas Travis", contact: "Contactar", kicker: "Otra forma de conocerme", intro: "Una conversación, no un currículum.", introMore: "Pregunta por mi trabajo. Descubre mi trayectoria.", experience: "Mi experiencia", skills: "Mis tecnologías", education: "Mi formación", askExperience: "Muéstrame su experiencia", askSkills: "¿Qué tecnologías usa?", askEducation: "¿Qué estudió?", suggested: "Preguntas sugeridas", conversation: "Conversación con Tomas Travis AI", preparing: "Preparando", updated: "Actualizada", answer: "Respuesta", source: "De mi perfil", direct: "Pregúntale a Tomas", retry: "Reintentar pregunta", followups: "Continuar la conversación", checking: "Consultando el perfil…", stopResponse: "Detener respuesta", ask: "Pregunta sobre Tomas", placeholder: "¿Qué te gustaría saber?", listening: "Escuchando…", stopRecording: "Detener grabación", dictate: "Dictar una pregunta", send: "Enviar pregunta", listeningHint: "Escuchando · pulsa detener para terminar", tagline: "Tus preguntas. Mi experiencia.", spoken: "Respuestas por voz", on: "activadas", off: "desactivadas", stopSpeaking: "Detener audio", footer: "Ingeniería de datos. IA. Software.", built: "Todo empieza con una conversación.", pause: "Pausar animación", resume: "Reanudar animación", role: "Ver este puesto", listed: "Incluido en el perfil", confirms: "Lo que confirma el perfil", evidence: "Habilidad y experiencia documentada", listedSkill: "Habilidad incluida", viewSource: "Ver fuente", sourceCaveat: "Solo se vinculan menciones explícitas en las descripciones de los puestos. Una habilidad incluida no demuestra por sí sola un nivel de dominio ni un resultado concreto.", noProjects: "Todavía no se han añadido proyectos independientes al perfil.", askWork: "Pregúntale a Tomas por su trabajo.", planned: "El perfil recoge un cambio previsto de Junior Engineer a Engineer en NTT DATA, con fecha de septiembre de 2026. Todavía no se ha añadido la confirmación del cambio.", empty: "Pregunta por el trabajo, la formación, los idiomas o las tecnologías de Tomas.", noSpeech: "Este navegador no permite leer las respuestas en voz alta. Puedes leerlas aquí.", noVoice: "Este dispositivo no tiene una voz disponible para este idioma. Puedes leer la respuesta en pantalla.", audioStopped: "El audio se ha detenido. La respuesta completa está en pantalla.", noRecognition: "Este navegador no permite dictar. Prueba el dictado del teclado del móvil o escribe tu pregunta.", permission: "No se ha permitido el acceso al micrófono. Puedes activarlo en los ajustes del navegador o seguir escribiendo.", capture: "No he podido captar la pregunta. Inténtalo otra vez o escríbela.", privacy: "El navegador puede usar su servicio de voz para transcribir el audio. Revisa el texto antes de enviarlo.", startVoice: "No se ha podido iniciar el dictado. Escribe tu pregunta para continuar.", rateLimit: "Has enviado muchas preguntas. Espera un momento y vuelve a intentarlo.", connection: "No se ha podido conectar con el asistente. Puedes consultar la información guardada en el perfil.", unexpected: "La respuesta del asistente no tenía el formato esperado. Se muestran los datos del perfil.", aiUnavailable: "El servicio de IA no está disponible; esta respuesta usa el perfil guardado.", interrupted: "La respuesta se ha interrumpido. La información del perfil está disponible abajo.", stopped: "Respuesta detenida. Se conservan tu pregunta y la información relacionada del perfil.", timeout: "La respuesta ha tardado demasiado. Se muestra la información relacionada del perfil.", inputError: "Escribe una pregunta de hasta 240 caracteres.",
  },
} satisfies Record<Language, Record<string, string>>;

const profileSpanish: Record<string, string> = {
  Programming: "Programación", "Cloud / DevOps": "Nube / DevOps", "Machine Learning": "Aprendizaje automático", Frontend: "Frontend", Analytics: "Analítica", Spanish: "Español", English: "Inglés", French: "Francés", Portuguese: "Portugués", Native: "Nativo",
  "Energy trading platforms based on microservice architectures": "Plataformas de compraventa de energía basadas en arquitecturas de microservicios",
  "ETLs and REST API integrations": "Procesos ETL e integraciones con API REST",
  "Prediction and reporting in Cloudera data environments": "Predicción e informes en entornos de datos Cloudera",
  "Technical estimation across frontend, backend and AWS orchestration": "Estimación técnica de frontend, backend y orquestación en AWS",
  "Coordination with clients and technical teams": "Coordinación con clientes y equipos técnicos",
  "AMS initiative leadership and mentoring of junior profiles": "Liderazgo de iniciativas AMS y mentoría de perfiles júnior",
  "Maintenance of machine-learning applications and microservices": "Mantenimiento de aplicaciones de aprendizaje automático y microservicios",
  "Anomaly detection and variable prediction": "Detección de anomalías y predicción de variables",
  "Kubernetes and virtual-machine deployment validation": "Validación de despliegues en Kubernetes y máquinas virtuales",
  "Reinforcement-learning models integrated with ROS 2": "Modelos de aprendizaje por refuerzo integrados con ROS 2",
  "Autonomous control of autonomous surface-vehicle fleets": "Control autónomo de flotas de vehículos autónomos de superficie",
};

export function profileText(text: string, language: Language): string {
  if (language === "en") return text;
  if (profileSpanish[text]) return profileSpanish[text];
  if (text.startsWith("Profile / Skills / ")) return `Perfil / Habilidades / ${profileSpanish[text.slice(19)] ?? text.slice(19)}`;
  return text.replace(/January|February|March|April|May|June|July|August|September|October|November|December|Present/g, value => ({ January: "enero", February: "febrero", March: "marzo", April: "abril", May: "mayo", June: "junio", July: "julio", August: "agosto", September: "septiembre", October: "octubre", November: "noviembre", December: "diciembre", Present: "actualidad" })[value]!);
}

export function translatedQuestion(question: string): string {
  const fixed: Record<string, string> = { "Who is Tomas?": "¿Quién es Tomas?", "Show me his experience": "Muéstrame su experiencia", "What did he study?": "¿Qué estudió?", "What technologies does he use?": "¿Qué tecnologías usa?", "What other technologies does he list?": "¿Qué otras tecnologías incluye?", "Tell me about Kubernetes": "Háblame de Kubernetes", "Tell me about his research": "Háblame de su investigación", "What languages does he speak?": "¿Qué idiomas habla?", "Is he good with Spark?": "¿Es bueno con Spark?", "Where did he use Kubernetes?": "¿Dónde usó Kubernetes?", "Compare Python with PySpark": "Compara Python con PySpark" };
  return fixed[question] ?? question.replace(/^Where did he use (.+)\?$/, "¿Dónde usó $1?").replace(/^Compare (.+) with (.+)$/, "Compara $1 con $2");
}
