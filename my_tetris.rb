# Declaring tetromino piecies
class Tetromino
  attr_reader :shape # initializing variable shape which will be available outside class
  
  def initialize(shape) # assigning value to shape
      @shape = shape
  end
  
  def self.all_shapes 
  {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
  } 
  end

  def rotate_clockwise
      @shape = @shape.reverse.transpose
  end

  def rotate_counterclockwise
      @shape = @shape.transpose.reverse
  end
end

# Declaring a game board
class Gameboard

  attr_reader :board

  def initialize # defining board
      @board = Array.new(20) {Array.new(10, 0)}
      @tetromino_bag = shuffle_tetromino
  end

  def shuffle_tetromino # creating shuffles list of tetrominos
      Tetromino.all_shapes.values.shuffle
  end

  def next_tetromino # removing used tetrominos and re-shuffle the list
      @tetromino_bag = shuffle_tetromino if @tetromino_bag.empty?
      @tetromino_bag.pop
  end

  def start_tetromino # defining starting position of each tetromino
      shape = next_tetromino # randomly selecting one teromino
      tetromino = Tetromino.new(shape)

      x = (10 - tetromino.shape[0].length)/2
      y = 0

      [tetromino, x, y]
  end

  def add_tetromino(tetromino, x, y)
      tetromino.shape.each_with_index do |row, i| # itirating through each 0 and 1 of the tetromino
          row.each_with_index do |cell, j|
              next if cell == 0
              @board[y + i][x + j] = 1 # placing each square of the tetromino on the board
          end
      end
  end

  def clear_tetromino(tetromino, x, y) # deleting tetromino before move etc
      tetromino.shape.each_with_index do |row, i|
          row.each_with_index do |cell, j|
              next if cell == 0
              @board[y + i][x + j] = 0
          end
      end
  end

  def collision?(tetromino, x, y) # checking if tetromino after action is colliding with something

      tetromino.shape.each_with_index do |row, i|
          row.each_with_index do |cell, j|
              next if cell == 0

              board_x = x + j
              board_y = y + i 
              # checking for collision at the bottom, left, right and with existing blocks
              # removing tetromino from the board before check insures that occupied cells within tetromino are not taken into account
              if board_y >= @board.size || board_x < 0 || board_x >= @board[0].size || @board[board_y][board_x] == 1
                  return true
              end
          end
      end
      false
  end

  def move_down(tetromino, x, y)
      clear_tetromino(tetromino, x, y)

      if collision?(tetromino, x, y + 1) # check if move can be performed
          add_tetromino(tetromino, x, y) # if collision detected add tetromino to the original position
          return false
      else 
          y += 1 # if no collision detected, 
          add_tetromino(tetromino, x, y) 
          return [true, x, y]
      end
  end

  def fast_drop (tetromino, x, y) # faster tetromino drop if arrow down is pressed
      clear_tetromino(tetromino, x, y)

      until collision?(tetromino, x, y + 1)
          y += 1
      end

      add_tetromino(tetromino, x, y)
      [x, y]
  end

  def move_right_left(tetromino, x, y, direction) # allows to move tetromino left and right
      clear_tetromino(tetromino, x, y)

      if collision?(tetromino, x + direction, y)
          add_tetromino(tetromino, x, y) # if collision detected add tetromino to the original position
          return false
      else
          x += direction
          add_tetromino(tetromino, x, y)
          return [true, x, y]
      end
  end 

  def rotate_tetromino(tetromino, x, y, direction) # rotation of tetromino
      clear_tetromino(tetromino, x, y)

      original_shape = tetromino.shape.dup # creating duplicate to save original tetromino position
      original_x = x

      # rotate tetromino
      if direction == :clockwise
          tetromino.rotate_clockwise
      elsif direction == :counterclockwise
          tetromino.rotate_counterclockwise
      else 
          return false
      end

      if collision?(tetromino, x, y) # checking if rotation is possible and adjust tetromino respectively
          # implementing bounce from the wall (not at the left wall)
          if x > 0
              x -= 1 # try to shift tetromino by 1 coordinate to the left 
              unless collision?(tetromino, x, y) # attempt rotation once again
                  add_tetromino(tetromino, x, y)
                  return [true, x, y]
              end
              x = original_x # if rotation fails even after shift reset to original position
          end

          # implementing bounce from the wall (not at the right wall)
          if x + tetromino.shape[0].length < @board[0].size
              x += 1
              unless collision?(tetromino, x, y)
                  add_tetromino(tetromino, x, y)
                  return [true, x, y]
              end
              x = original_x
          end

          # if shift doesn't help rotation reset the tetromino position
          tetromino.shape = original_shape
          add_tetromino(tetromino, x, y)
          return false
      else
          add_tetromino(tetromino, x, y)
          return true
      end

  end
  
  def lock_tetromino(tetromino, x, y) # completing one tetromino move by locking tetromino on the board, delete completed line and adjust board accordingly
      add_tetromino(tetromino, x, y)
      lines_cleared = clear_lines # clearing lines with all 1 and keeping scoring of it
      new_tetromino, new_x, new_y = start_tetromino # placing new tetromino at the top and recording what shape and new coordinates of the 
      
      if collision?(new_tetromino, new_x, new_y) # check if new tetromino can be placed and signify "Game Over"
          return :game_over
      else
          [new_tetromino, new_x, new_y, lines_cleared]
      end
  end

  def clear_lines # removing lines full of tetrominos
      @board.reject! {|row| row.all? {|cell| cell == 1}} # removes all lines that has all 1
      lines_cleared = 20 - @board.size # calculates how many lines are removed
      lines_cleared.times {@board.unshift(Array.new(10, 0))} # adding missing lines at the top
      lines_cleared
  end

end