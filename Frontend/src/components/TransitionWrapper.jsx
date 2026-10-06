import { motion } from "framer-motion";

function TransitionWrapper({ children }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 25,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -25,
      }}
      transition={{
        duration: 0.45,
      }}
    >
      {children}
    </motion.div>
  );
}

export default TransitionWrapper;