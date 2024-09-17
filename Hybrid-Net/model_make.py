import torch
import torch.optim as optim
from models.beat_net import BeatNet

# Initialize the model
model = BeatNet()

# Define loss function and optimizer
criterion = torch.nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training loop
for epoch in range(num_epochs):
    for inputs, labels in train_loader:
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

# Save the trained model
torch.save(model.state_dict(), 'beat_net.pth')
