// src/components/ArticleList.jsx (version 4.0)
import { Accordion } from '@/components/ui/accordion'
import { ArticleCard } from '@/components/ArticleCard'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedList, itemVariants } from './AnimatedList'

export const ArticleList = ({ articles, onDelete }) => {
  return (
    <Accordion type="single" collapsible>
      <AnimatedList className="w-full space-y-2">
        <AnimatePresence>
          {articles.map((article) => (
            <motion.div
              key={article._id}
              variants={itemVariants}
              exit={itemVariants.exit} // Use exit variant from shared config
              layout
            >
              <ArticleCard article={article} onDelete={() => onDelete(article._id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </AnimatedList>
    </Accordion>
  )
}
